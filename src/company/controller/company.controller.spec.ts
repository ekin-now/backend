import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyController } from './company.controller';
import { CompanyService } from '../service/company.service';
import { StripeService } from '../../stripe/stripe.service';
import { UserRole } from '../../auth/decorators/userRole.enum';
import { Company } from '../entities/company.entity';

const mockCompany: Company = {
  id: 'uuid-1',
  name: 'Ekinnow Sports',
  slug: 'ekinnow-sports',
  description: 'Sports company',
  website: undefined,
  email: undefined,
  phone: undefined,
  logoUrl: undefined,
  bannerUrl: undefined,
  country: undefined,
  city: undefined,
  address: undefined,
  sportType: undefined,
  companyType: undefined,
  stripeAccountId: undefined,
  stripeOnboardingComplete: false,
  isActive: true,
  users: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCompanyService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  setStripeAccount: jest.fn(),
  setOnboardingComplete: jest.fn(),
};

const mockStripeService = {
  createConnectAccount: jest.fn(),
  createAccountLink: jest.fn(),
};

const superAdminReq = {
  user: { id: 'admin-id', role: UserRole.SUPER_ADMIN, companyId: undefined },
};
const companyAdminReq = {
  user: { id: 'cadmin-id', role: UserRole.COMPANY_ADMIN, companyId: 'uuid-1' },
};
const participantReq = {
  user: { id: 'part-id', role: UserRole.PARTICIPANT, companyId: undefined },
};

describe('CompanyController', () => {
  let controller: CompanyController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        { provide: CompanyService, useValue: mockCompanyService },
        { provide: StripeService, useValue: mockStripeService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:4200') },
        },
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  describe('create', () => {
    it('delegates to service and returns result', async () => {
      const dto = { name: 'Ekinnow Sports' };
      mockCompanyService.create.mockResolvedValue(mockCompany);

      const result = await controller.create(dto);

      expect(mockCompanyService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCompany);
    });
  });

  describe('findAll', () => {
    it('returns all active companies', async () => {
      mockCompanyService.findAll.mockResolvedValue([mockCompany]);

      const result = await controller.findAll();

      expect(result).toEqual([mockCompany]);
    });
  });

  describe('findOne', () => {
    it('returns company when found', async () => {
      mockCompanyService.findOne.mockResolvedValue(mockCompany);

      const result = await controller.findOne('uuid-1');

      expect(result).toEqual(mockCompany);
    });

    it('throws NotFoundException when not found', async () => {
      mockCompanyService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto = { city: 'Madrid' };

    it('SUPER_ADMIN can update any company', async () => {
      const updated = { ...mockCompany, city: 'Madrid' };
      mockCompanyService.update.mockResolvedValue(updated);

      const result = await controller.update(
        'uuid-1',
        dto,
        superAdminReq as any,
      );

      expect(result).toMatchObject({ city: 'Madrid' });
    });

    it('COMPANY_ADMIN can update own company', async () => {
      const updated = { ...mockCompany, city: 'Madrid' };
      mockCompanyService.update.mockResolvedValue(updated);

      const result = await controller.update(
        'uuid-1',
        dto,
        companyAdminReq as any,
      );

      expect(result).toMatchObject({ city: 'Madrid' });
    });

    it('COMPANY_ADMIN cannot update another company', () => {
      const otherAdminReq = {
        user: {
          id: 'other-id',
          role: UserRole.COMPANY_ADMIN,
          companyId: 'uuid-2',
        },
      };

      expect(() =>
        controller.update('uuid-1', dto, otherAdminReq as any),
      ).toThrow(ForbiddenException);
    });

    it('PARTICIPANT throws ForbiddenException', () => {
      expect(() =>
        controller.update('uuid-1', dto, participantReq as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('delegates to service', async () => {
      mockCompanyService.remove.mockResolvedValue(undefined);

      await controller.remove('uuid-1');

      expect(mockCompanyService.remove).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('stripeOnboard', () => {
    it('creates Stripe account and returns onboarding URL for COMPANY_ADMIN', async () => {
      mockCompanyService.findOne.mockResolvedValue({
        ...mockCompany,
        email: 'test@test.com',
      });
      mockStripeService.createConnectAccount.mockResolvedValue({
        id: 'acct_new',
      });
      mockCompanyService.setStripeAccount.mockResolvedValue(undefined);
      mockStripeService.createAccountLink.mockResolvedValue({
        url: 'https://connect.stripe.com/onboard',
      });

      const result = await controller.stripeOnboard(
        'uuid-1',
        companyAdminReq as any,
      );

      expect(mockStripeService.createConnectAccount).toHaveBeenCalled();
      expect(mockCompanyService.setStripeAccount).toHaveBeenCalledWith(
        'uuid-1',
        'acct_new',
      );
      expect(result).toEqual({ url: 'https://connect.stripe.com/onboard' });
    });

    it('reuses existing stripeAccountId without creating new account', async () => {
      mockCompanyService.findOne.mockResolvedValue({
        ...mockCompany,
        stripeAccountId: 'acct_existing',
      });
      mockStripeService.createAccountLink.mockResolvedValue({
        url: 'https://connect.stripe.com/onboard',
      });

      await controller.stripeOnboard('uuid-1', companyAdminReq as any);

      expect(mockStripeService.createConnectAccount).not.toHaveBeenCalled();
      expect(mockStripeService.createAccountLink).toHaveBeenCalledWith(
        'acct_existing',
        expect.any(String),
        expect.any(String),
      );
    });

    it('throws ForbiddenException for non-owner COMPANY_ADMIN', async () => {
      const otherAdminReq = {
        user: { id: 'x', role: UserRole.COMPANY_ADMIN, companyId: 'uuid-2' },
      };

      await expect(
        controller.stripeOnboard('uuid-1', otherAdminReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when company not found', async () => {
      mockCompanyService.findOne.mockResolvedValue(null);

      await expect(
        controller.stripeOnboard('uuid-1', superAdminReq as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('stripeStatus', () => {
    it('returns Stripe Connect status for own company', async () => {
      mockCompanyService.findOne.mockResolvedValue({
        ...mockCompany,
        stripeAccountId: 'acct_test',
        stripeOnboardingComplete: true,
      });

      const result = await controller.stripeStatus(
        'uuid-1',
        companyAdminReq as any,
      );

      expect(result).toEqual({
        stripeAccountId: 'acct_test',
        stripeOnboardingComplete: true,
      });
    });

    it('throws ForbiddenException for non-owner', async () => {
      const otherAdminReq = {
        user: { id: 'x', role: UserRole.COMPANY_ADMIN, companyId: 'uuid-2' },
      };

      await expect(
        controller.stripeStatus('uuid-1', otherAdminReq as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
