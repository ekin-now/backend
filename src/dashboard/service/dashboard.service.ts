import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { Registration } from '../../registration/entities/registration.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { SportEventStatus } from '../../sport-event/entities/sport.event-status.enum';
import { RegistrationStatus } from '../../registration/entities/registration-status.enum';
import { PaymentStatus } from '../../payment/entities/payment-status.enum';
import { DashboardStatsResponseDto } from '../dto/dashboard-stats-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SportEvent)
    private readonly eventRepo: Repository<SportEvent>,
    @InjectRepository(SportSubEvent)
    private readonly subEventRepo: Repository<SportSubEvent>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getStats(companyId?: string): Promise<DashboardStatsResponseDto> {
    const [
      activeEvents,
      upcomingEvents,
      totalParticipants,
      pendingRegistrations,
      monthlyRevenue,
      failedPayments,
      revenueByMonth,
      registrationsByMonth,
    ] = await Promise.all([
      this.getActiveEventsCount(companyId),
      this.getUpcomingEventsCount(companyId),
      this.getTotalParticipants(companyId),
      this.getPendingRegistrationsCount(companyId),
      this.getMonthlyRevenue(companyId),
      this.getFailedPaymentsCount(companyId),
      this.getRevenueByMonth(companyId),
      this.getRegistrationsByMonth(companyId),
    ]);

    return {
      activeEvents,
      upcomingEvents,
      totalParticipants,
      pendingRegistrations,
      monthlyRevenue,
      failedPayments,
      revenueByMonth,
      registrationsByMonth,
    };
  }

  private getActiveEventsCount(companyId?: string): Promise<number> {
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.status IN (:...statuses)', {
        statuses: [
          SportEventStatus.PUBLISHED,
          SportEventStatus.REGISTRATION_OPEN,
        ],
      });
    if (companyId) qb.andWhere('e.companyId = :companyId', { companyId });
    return qb.getCount();
  }

  private getUpcomingEventsCount(companyId?: string): Promise<number> {
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .where('e.eventDate > NOW()')
      .andWhere('e.status NOT IN (:...statuses)', {
        statuses: [SportEventStatus.CANCELLED, SportEventStatus.DRAFT],
      });
    if (companyId) qb.andWhere('e.companyId = :companyId', { companyId });
    return qb.getCount();
  }

  private async getTotalParticipants(companyId?: string): Promise<number> {
    const qb = this.subEventRepo
      .createQueryBuilder('sse')
      .select('COALESCE(SUM(sse.registeredParticipants), 0)', 'total');
    if (companyId) {
      qb.innerJoin('sse.sportEvent', 'se').andWhere(
        'se.companyId = :companyId',
        { companyId },
      );
    }
    const raw = await qb.getRawOne<{ total: string }>();
    return parseInt(raw?.total ?? '0', 10);
  }

  private getPendingRegistrationsCount(companyId?: string): Promise<number> {
    const qb = this.registrationRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: RegistrationStatus.PENDING });
    if (companyId) {
      qb.innerJoin('r.sportEvent', 'se').andWhere('se.companyId = :companyId', {
        companyId,
      });
    }
    return qb.getCount();
  }

  private async getMonthlyRevenue(companyId?: string): Promise<number> {
    const qb = this.paymentRepo
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

  private getFailedPaymentsCount(companyId?: string): Promise<number> {
    const qb = this.paymentRepo
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

  private async getRevenueByMonth(
    companyId?: string,
  ): Promise<{ month: string; value: number }[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select("TO_CHAR(p.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'value')
      .where('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere("p.createdAt >= NOW() - INTERVAL '12 months'")
      .groupBy("TO_CHAR(p.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(p.createdAt, 'YYYY-MM')", 'ASC');
    if (companyId) {
      qb.innerJoin('p.registration', 'r')
        .innerJoin('r.sportEvent', 'se')
        .andWhere('se.companyId = :companyId', { companyId });
    }
    const raw = await qb.getRawMany<{ month: string; value: string }>();
    return raw.map((r) => ({ month: r.month, value: parseFloat(r.value) }));
  }

  private async getRegistrationsByMonth(
    companyId?: string,
  ): Promise<{ month: string; value: number }[]> {
    const qb = this.registrationRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'value')
      .where("r.createdAt >= NOW() - INTERVAL '12 months'")
      .andWhere('r.status != :status', { status: RegistrationStatus.CANCELLED })
      .groupBy("TO_CHAR(r.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(r.createdAt, 'YYYY-MM')", 'ASC');
    if (companyId) {
      qb.innerJoin('r.sportEvent', 'se').andWhere('se.companyId = :companyId', {
        companyId,
      });
    }
    const raw = await qb.getRawMany<{ month: string; value: string }>();
    return raw.map((r) => ({ month: r.month, value: parseInt(r.value, 10) }));
  }
}
