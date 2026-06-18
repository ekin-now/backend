import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from '../service/registration.service';
import { RegistrationStatus } from '../entities/registration-status.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';
import { Registration } from '../entities/registration.entity';

const mockReg: Partial<Registration> = {
  id: 'reg-1',
  participantId: 'user-1',
  sportEventId: 'event-1',
  subEventId: 'sub-1',
  status: RegistrationStatus.PENDING,
  sportEvent: { companyId: 'company-1' } as any,
};

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllByParticipant: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  cancel: jest.fn(),
  remove: jest.fn(),
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

describe('RegistrationController', () => {
  let controller: RegistrationController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [{ provide: RegistrationService, useValue: mockService }],
    }).compile();

    controller = module.get(RegistrationController);
  });

  describe('create', () => {
    it('creates registration for authenticated user', async () => {
      const dto = { subEventId: 'sub-1' };
      mockService.create.mockResolvedValue(mockReg);

      const result = await controller.create(dto, participantReq as any);

      expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockReg);
    });
  });

  describe('findAll', () => {
    it('SUPER_ADMIN sees all registrations (no companyId filter)', async () => {
      mockService.findAll.mockResolvedValue([mockReg]);

      await controller.findAll(superAdminReq as any);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: undefined }),
      );
    });

    it('COMPANY_ADMIN scoped to own company', async () => {
      mockService.findAll.mockResolvedValue([mockReg]);

      await controller.findAll(companyAdminReq as any);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-1' }),
      );
    });
  });

  describe('findMine', () => {
    it('returns own registrations', async () => {
      mockService.findAllByParticipant.mockResolvedValue([mockReg]);

      const result = await controller.findMine(participantReq as any);

      expect(mockService.findAllByParticipant).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockReg]);
    });
  });

  describe('findOne', () => {
    it('owner can read own registration', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      const result = await controller.findOne('reg-1', participantReq as any);

      expect(result).toEqual(mockReg);
    });

    it('SUPER_ADMIN can read any registration', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      const result = await controller.findOne('reg-1', superAdminReq as any);

      expect(result).toEqual(mockReg);
    });

    it('COMPANY_ADMIN with matching company can read registration', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      const result = await controller.findOne('reg-1', companyAdminReq as any);

      expect(result).toEqual(mockReg);
    });

    it('COMPANY_ADMIN from different company throws ForbiddenException', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      await expect(
        controller.findOne('reg-1', otherCompanyReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('different participant throws ForbiddenException', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      await expect(
        controller.findOne('reg-1', otherParticipantReq as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const dto = { status: RegistrationStatus.APPROVED };

    it('SUPER_ADMIN can update any registration', async () => {
      mockService.updateStatus.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.APPROVED,
      });

      const result = await controller.updateStatus(
        'reg-1',
        dto,
        superAdminReq as any,
      );

      expect(mockService.updateStatus).toHaveBeenCalledWith('reg-1', dto);
      expect(result).toMatchObject({ status: RegistrationStatus.APPROVED });
    });

    it('COMPANY_ADMIN can update own company registration', async () => {
      mockService.findOne.mockResolvedValue(mockReg);
      mockService.updateStatus.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.APPROVED,
      });

      await controller.updateStatus('reg-1', dto, companyAdminReq as any);

      expect(mockService.updateStatus).toHaveBeenCalledWith('reg-1', dto);
    });

    it('COMPANY_ADMIN cannot update other company registration', async () => {
      mockService.findOne.mockResolvedValue(mockReg);

      await expect(
        controller.updateStatus('reg-1', dto, otherCompanyReq as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('delegates cancel to service with participant id', async () => {
      mockService.cancel.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.CANCELLED,
      });

      await controller.cancel('reg-1', participantReq as any);

      expect(mockService.cancel).toHaveBeenCalledWith('reg-1', 'user-1');
    });
  });

  describe('remove', () => {
    it('delegates remove to service', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('reg-1');

      expect(mockService.remove).toHaveBeenCalledWith('reg-1');
    });
  });
});
