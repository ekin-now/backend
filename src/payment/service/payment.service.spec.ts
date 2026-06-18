import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { StripeService } from '../../stripe/stripe.service';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../entities/payment-status.enum';
import { PaymentMethod } from '../entities/payment-method.enum';
import { Registration } from '../../registration/entities/registration.entity';
import { Company } from '../../company/entities/company.entity';

const mockPayment: Partial<Payment> = {
  id: 'pay-1',
  registrationId: 'reg-1',
  participantId: 'user-1',
  amount: 65,
  currency: 'EUR',
  method: PaymentMethod.CARD,
  status: PaymentStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRegistration = {
  id: 'reg-1',
  participantId: 'user-1',
  sportEvent: { companyId: 'company-1' },
};

const mockQb: any = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  getCount: jest.fn(),
};

const mockPaymentRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

const mockRegistrationRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
};

const mockCompanyRepo = {
  findOneBy: jest.fn(),
  update: jest.fn(),
};

const mockStripeService = {
  createPaymentIntent: jest.fn(),
  constructWebhookEvent: jest.fn(),
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepo,
        },
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: StripeService, useValue: mockStripeService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(5) },
        },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  describe('create', () => {
    const dto = { registrationId: 'reg-1', amount: 65 };

    it('creates payment linked to registration participant', async () => {
      mockRegistrationRepo.findOneBy.mockResolvedValue(mockRegistration);
      mockPaymentRepo.create.mockReturnValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue(mockPayment);

      const result = await service.create(dto);

      expect(mockPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ participantId: 'user-1', currency: 'EUR' }),
      );
      expect(result).toEqual(mockPayment);
    });

    it('throws NotFoundException when registration not found', async () => {
      mockRegistrationRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCheckout', () => {
    const dto = { registrationId: 'reg-1', amount: 6500 };

    it('creates PaymentIntent without Connect when company has no Stripe account', async () => {
      mockRegistrationRepo.findOne.mockResolvedValue({
        ...mockRegistration,
        sportEvent: { companyId: 'company-1' },
      });
      mockCompanyRepo.findOneBy.mockResolvedValue({
        stripeAccountId: null,
        stripeOnboardingComplete: false,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'pi_test_secret',
      });
      mockPaymentRepo.create.mockReturnValue({
        ...mockPayment,
        stripePaymentIntentId: 'pi_test',
      });
      mockPaymentRepo.save.mockResolvedValue({ ...mockPayment, id: 'pay-1' });

      const result = await service.createCheckout(dto, 'user-1');

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 6500,
          currency: 'eur',
          stripeAccountId: undefined,
        }),
      );
      expect(result).toMatchObject({
        paymentId: 'pay-1',
        clientSecret: 'pi_test_secret',
      });
    });

    it('creates PaymentIntent with Connect when company onboarding complete', async () => {
      mockRegistrationRepo.findOne.mockResolvedValue({
        ...mockRegistration,
        sportEvent: { companyId: 'company-1' },
      });
      mockCompanyRepo.findOneBy.mockResolvedValue({
        stripeAccountId: 'acct_test',
        stripeOnboardingComplete: true,
      });
      mockStripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
        client_secret: 'pi_test_secret',
      });
      mockPaymentRepo.create.mockReturnValue({ ...mockPayment });
      mockPaymentRepo.save.mockResolvedValue({ ...mockPayment, id: 'pay-1' });

      await service.createCheckout(dto, 'user-1');

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeAccountId: 'acct_test',
          applicationFeeAmount: 325, // 5% of 6500
        }),
      );
    });

    it('throws NotFoundException when registration not found', async () => {
      mockRegistrationRepo.findOne.mockResolvedValue(null);

      await expect(service.createCheckout(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('handleStripeWebhook', () => {
    it('sets status COMPLETED on payment_intent.succeeded', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } },
      });
      mockPaymentRepo.update.mockResolvedValue(undefined);

      await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(mockPaymentRepo.update).toHaveBeenCalledWith(
        { stripePaymentIntentId: 'pi_test' },
        { status: PaymentStatus.COMPLETED },
      );
    });

    it('sets status FAILED on payment_intent.payment_failed', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_test' } },
      });
      mockPaymentRepo.update.mockResolvedValue(undefined);

      await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(mockPaymentRepo.update).toHaveBeenCalledWith(
        { stripePaymentIntentId: 'pi_test' },
        { status: PaymentStatus.FAILED },
      );
    });

    it('marks company onboarding complete on account.updated with charges_enabled', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'account.updated',
        data: { object: { id: 'acct_test', charges_enabled: true } },
      });
      mockCompanyRepo.update.mockResolvedValue(undefined);

      await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(mockCompanyRepo.update).toHaveBeenCalledWith(
        { stripeAccountId: 'acct_test' },
        { stripeOnboardingComplete: true },
      );
    });

    it('ignores account.updated when charges not yet enabled', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'account.updated',
        data: { object: { id: 'acct_test', charges_enabled: false } },
      });

      await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(mockCompanyRepo.update).not.toHaveBeenCalled();
    });

    it('ignores unhandled event types', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        type: 'customer.created',
        data: { object: { id: 'cus_test' } },
      });

      await service.handleStripeWebhook(Buffer.from('{}'), 'sig');

      expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns payment with nested relations', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);

      const result = await service.findOne('pay-1');

      expect(mockPaymentRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'pay-1' } }),
      );
      expect(result).toEqual(mockPayment);
    });

    it('throws NotFoundException when not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('updates status and returns payment', async () => {
      const completed = { ...mockPayment, status: PaymentStatus.COMPLETED };
      mockPaymentRepo.findOne.mockResolvedValue({ ...mockPayment });
      mockPaymentRepo.save.mockResolvedValue(completed);

      const result = await service.updateStatus('pay-1', {
        status: PaymentStatus.COMPLETED,
        transactionId: 'txn_abc',
      });

      expect(mockPaymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.COMPLETED,
          transactionId: 'txn_abc',
        }),
      );
      expect(result).toMatchObject({ status: PaymentStatus.COMPLETED });
    });

    it('throws NotFoundException when payment not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', {
          status: PaymentStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRegistrationWithEvent', () => {
    it('returns registration with sport event', async () => {
      mockRegistrationRepo.findOne.mockResolvedValue(mockRegistration);

      const result = await service.findRegistrationWithEvent('reg-1');

      expect(result).toEqual(mockRegistration);
    });

    it('throws NotFoundException when registration not found', async () => {
      mockRegistrationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findRegistrationWithEvent('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
