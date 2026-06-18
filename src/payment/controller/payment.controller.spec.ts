import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../service/payment.service';
import { PaymentStatus } from '../entities/payment-status.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';
import { Payment } from '../entities/payment.entity';

const mockPayment: Partial<Payment> = {
  id: 'pay-1',
  registrationId: 'reg-1',
  participantId: 'user-1',
  amount: 65,
  currency: 'EUR',
  status: PaymentStatus.PENDING,
  registration: {
    sportEvent: { companyId: 'company-1' },
  } as any,
};

const mockService = {
  create: jest.fn(),
  createCheckout: jest.fn(),
  handleStripeWebhook: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  findRegistrationWithEvent: jest.fn(),
};

const superAdminReq = {
  user: { id: 'admin-id', role: UserRole.SUPER_ADMIN, companyId: undefined },
};
const companyAdminReq = {
  user: {
    id: 'cadmin-id',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'company-1',
  },
};
const otherCompanyReq = {
  user: {
    id: 'other-id',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'company-2',
  },
};
const participantReq = {
  user: { id: 'user-1', role: UserRole.PARTICIPANT, companyId: undefined },
};
const otherParticipantReq = {
  user: { id: 'other-user', role: UserRole.PARTICIPANT, companyId: undefined },
};

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [{ provide: PaymentService, useValue: mockService }],
    }).compile();

    controller = module.get(PaymentController);
  });

  describe('createCheckout', () => {
    it('delegates to service with participantId from request', async () => {
      const dto = { registrationId: 'reg-1', amount: 6500 };
      const checkoutResponse = {
        paymentId: 'pay-1',
        clientSecret: 'pi_test_secret',
      };
      mockService.createCheckout.mockResolvedValue(checkoutResponse);

      const result = await controller.createCheckout(
        dto as any,
        participantReq as any,
      );

      expect(mockService.createCheckout).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(checkoutResponse);
    });
  });

  describe('stripeWebhook', () => {
    it('delegates to service with rawBody and signature', async () => {
      mockService.handleStripeWebhook.mockResolvedValue(undefined);
      const rawBody = Buffer.from('{}');
      const req = { rawBody } as any;

      const result = await controller.stripeWebhook(req, 'stripe-sig');

      expect(mockService.handleStripeWebhook).toHaveBeenCalledWith(
        rawBody,
        'stripe-sig',
      );
      expect(result).toEqual({ received: true });
    });
  });

  describe('create', () => {
    const dto = { registrationId: 'reg-1', amount: 65 };
    const mockReg = { sportEvent: { companyId: 'company-1' } };

    it('SUPER_ADMIN creates without company check', async () => {
      mockService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(dto as any, superAdminReq as any);

      expect(mockService.findRegistrationWithEvent).not.toHaveBeenCalled();
      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPayment);
    });

    it('COMPANY_ADMIN creates for own company', async () => {
      mockService.findRegistrationWithEvent.mockResolvedValue(mockReg);
      mockService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(
        dto as any,
        companyAdminReq as any,
      );

      expect(mockService.findRegistrationWithEvent).toHaveBeenCalledWith(
        'reg-1',
      );
      expect(result).toEqual(mockPayment);
    });

    it('COMPANY_ADMIN throws ForbiddenException for other company', async () => {
      mockService.findRegistrationWithEvent.mockResolvedValue(mockReg);

      await expect(
        controller.create(dto as any, otherCompanyReq as any),
      ).rejects.toThrow(ForbiddenException);
      expect(mockService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('SUPER_ADMIN sees all payments (no companyId filter)', async () => {
      mockService.findAll.mockResolvedValue([mockPayment]);

      await controller.findAll(superAdminReq as any);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: undefined }),
      );
    });

    it('COMPANY_ADMIN scoped to own company', async () => {
      mockService.findAll.mockResolvedValue([mockPayment]);

      await controller.findAll(companyAdminReq as any);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-1' }),
      );
    });
  });

  describe('findMine', () => {
    it('returns own payments by participantId', async () => {
      mockService.findAll.mockResolvedValue([mockPayment]);

      const result = await controller.findMine(participantReq as any);

      expect(mockService.findAll).toHaveBeenCalledWith({
        participantId: 'user-1',
      });
      expect(result).toEqual([mockPayment]);
    });
  });

  describe('findOne', () => {
    it('owner can read own payment', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('pay-1', participantReq as any);

      expect(result).toEqual(mockPayment);
    });

    it('SUPER_ADMIN can read any payment', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('pay-1', superAdminReq as any);

      expect(result).toEqual(mockPayment);
    });

    it('COMPANY_ADMIN with matching company can read payment', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne('pay-1', companyAdminReq as any);

      expect(result).toEqual(mockPayment);
    });

    it('COMPANY_ADMIN from different company throws ForbiddenException', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      await expect(
        controller.findOne('pay-1', otherCompanyReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('different participant throws ForbiddenException', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      await expect(
        controller.findOne('pay-1', otherParticipantReq as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const dto = { status: PaymentStatus.COMPLETED };

    it('SUPER_ADMIN updates without company check', async () => {
      mockService.updateStatus.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      const result = await controller.updateStatus(
        'pay-1',
        dto,
        superAdminReq as any,
      );

      expect(mockService.findOne).not.toHaveBeenCalled();
      expect(mockService.updateStatus).toHaveBeenCalledWith('pay-1', dto);
      expect(result).toMatchObject({ status: PaymentStatus.COMPLETED });
    });

    it('COMPANY_ADMIN can update own company payment', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);
      mockService.updateStatus.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      await controller.updateStatus('pay-1', dto, companyAdminReq as any);

      expect(mockService.updateStatus).toHaveBeenCalledWith('pay-1', dto);
    });

    it('COMPANY_ADMIN cannot update other company payment', async () => {
      mockService.findOne.mockResolvedValue(mockPayment);

      await expect(
        controller.updateStatus('pay-1', dto, otherCompanyReq as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
