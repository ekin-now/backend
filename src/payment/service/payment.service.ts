import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../entities/payment-status.enum';
import { PaymentMethod } from '../entities/payment-method.enum';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { UpdatePaymentStatusDto } from '../dto/update-payment-status.dto';
import { Registration } from '../../registration/entities/registration.entity';
import { Company } from '../../company/entities/company.entity';
import { StripeService } from '../../stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  async createCheckout(
    dto: CreateCheckoutDto,
    participantId: string,
  ): Promise<{ paymentId: string; clientSecret: string }> {
    const registration = await this.registrationRepo.findOne({
      where: { id: dto.registrationId },
      relations: { sportEvent: true },
    });
    if (!registration) throw new NotFoundException('Registration not found');

    const currency = (dto.currency ?? 'eur').toLowerCase();

    let stripeAccountId: string | undefined;
    let applicationFeeAmount: number | undefined;

    if (registration.sportEvent?.companyId) {
      const company = await this.companyRepo.findOneBy({
        id: registration.sportEvent.companyId,
      });
      if (company?.stripeAccountId && company.stripeOnboardingComplete) {
        stripeAccountId = company.stripeAccountId;
        const feePct =
          this.config.get<number>('STRIPE_PLATFORM_FEE_PERCENT') ?? 5;
        applicationFeeAmount = Math.round((dto.amount * feePct) / 100);
      }
    }

    const intent = await this.stripeService.createPaymentIntent({
      amount: dto.amount,
      currency,
      metadata: { registrationId: dto.registrationId, participantId },
      stripeAccountId,
      applicationFeeAmount,
    });

    const payment = await this.repo.save(
      this.repo.create({
        registrationId: dto.registrationId,
        participantId,
        amount: dto.amount / 100,
        currency: currency.toUpperCase(),
        method: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: intent.id,
      }),
    );

    return { paymentId: payment.id, clientSecret: intent.client_secret! };
  }

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const registration = await this.registrationRepo.findOneBy({
      id: dto.registrationId,
    });
    if (!registration) throw new NotFoundException('Registration not found');

    const payment = this.repo.create({
      ...dto,
      participantId: registration.participantId,
      currency: dto.currency ?? 'EUR',
    });
    return this.repo.save(payment);
  }

  findAll(filters: {
    companyId?: string;
    participantId?: string;
    status?: PaymentStatus;
  }): Promise<Payment[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.participant', 'u')
      .leftJoinAndSelect('p.registration', 'r')
      .leftJoinAndSelect('r.sportEvent', 'se')
      .orderBy('p.createdAt', 'DESC');

    if (filters.companyId) {
      qb.andWhere('se.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }
    if (filters.participantId) {
      qb.andWhere('p.participantId = :participantId', {
        participantId: filters.participantId,
      });
    }
    if (filters.status) {
      qb.andWhere('p.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.repo.findOne({
      where: { id },
      relations: { participant: true, registration: { sportEvent: true } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async findRegistrationWithEvent(registrationId: string) {
    const reg = await this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: { sportEvent: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    return reg;
  }

  async updateStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = dto.status;
    if (dto.transactionId !== undefined)
      payment.transactionId = dto.transactionId;
    if (dto.notes !== undefined) payment.notes = dto.notes;
    return this.repo.save(payment);
  }

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripeService.constructWebhookEvent(payload, signature);
    const obj = event.data.object as { id: string; charges_enabled?: boolean };

    if (event.type === 'payment_intent.succeeded') {
      await this.repo.update(
        { stripePaymentIntentId: obj.id },
        { status: PaymentStatus.COMPLETED },
      );
    } else if (event.type === 'payment_intent.payment_failed') {
      await this.repo.update(
        { stripePaymentIntentId: obj.id },
        { status: PaymentStatus.FAILED },
      );
    } else if (event.type === 'account.updated' && obj.charges_enabled) {
      await this.companyRepo.update(
        { stripeAccountId: obj.id },
        { stripeOnboardingComplete: true },
      );
    }
  }

  async getMonthlyRevenue(
    companyId?: string,
  ): Promise<{ month: string; amount: number }[]> {
    const qb = this.repo
      .createQueryBuilder('p')
      .select("TO_CHAR(p.createdAt, 'YYYY-MM')", 'month')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere("p.createdAt >= NOW() - INTERVAL '12 months'")
      .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(p.createdAt, 'YYYY-MM')", 'ASC');

    if (companyId) {
      qb.innerJoin('p.registration', 'r')
        .innerJoin('r.sportEvent', 'se')
        .andWhere('se.companyId = :companyId', { companyId });
    }

    const raw = await qb.getRawMany<{ month: string; amount: string }>();
    return raw.map((r) => ({ month: r.month, amount: parseFloat(r.amount) }));
  }

  async getMonthlyTotal(companyId?: string): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere(
        "DATE_TRUNC('month', p.createdAt) = DATE_TRUNC('month', NOW())",
      );

    if (companyId) {
      qb.innerJoin('p.registration', 'r')
        .innerJoin('r.sportEvent', 'se')
        .andWhere('se.companyId = :companyId', { companyId });
    }

    const raw = await qb.getRawOne<{ total: string }>();
    return parseFloat(raw?.total ?? '0');
  }

  async getFailedCount(companyId?: string): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.FAILED })
      .andWhere(
        "DATE_TRUNC('month', p.createdAt) = DATE_TRUNC('month', NOW())",
      );

    if (companyId) {
      qb.innerJoin('p.registration', 'r')
        .innerJoin('r.sportEvent', 'se')
        .andWhere('se.companyId = :companyId', { companyId });
    }

    return qb.getCount();
  }
}
