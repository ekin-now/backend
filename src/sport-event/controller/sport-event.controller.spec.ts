import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SportEventController } from './sport-event.controller';
import { SportEventService } from '../service/sport-event.service';
import { SportEvent } from '../entities/sport-event.entity';
import { SportEventStatus } from '../entities/sport.event-status.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';

const mockEvent: Partial<SportEvent> = {
  id: 'uuid-1',
  slug: 'madrid-trail-2025',
  name: 'Madrid Trail 2025',
  status: SportEventStatus.DRAFT,
  companyId: 'company-uuid-1',
};

const mockSportEventService = {
  create: jest.fn(),
  findAll: jest.fn(),
  getFilterOptions: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const superAdminReq = {
  user: { role: UserRole.SUPER_ADMIN, companyId: undefined },
};
const companyAdminReq = {
  user: { role: UserRole.COMPANY_ADMIN, companyId: 'company-uuid-1' },
};
const otherCompanyAdminReq = {
  user: { role: UserRole.COMPANY_ADMIN, companyId: 'other-company' },
};

describe('SportEventController', () => {
  let controller: SportEventController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportEventController],
      providers: [
        { provide: SportEventService, useValue: mockSportEventService },
      ],
    }).compile();

    controller = module.get<SportEventController>(SportEventController);
  });

  describe('create', () => {
    it('SUPER_ADMIN creates event with dto companyId', async () => {
      const dto = { name: 'Test', companyId: 'company-uuid-1' };
      mockSportEventService.create.mockResolvedValue(mockEvent);

      await controller.create(dto as any, superAdminReq as any);

      expect(mockSportEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-uuid-1' }),
      );
    });

    it('SUPER_ADMIN throws BadRequestException if no companyId', () => {
      const dto = { name: 'Test' };

      expect(() => controller.create(dto as any, superAdminReq as any)).toThrow(
        BadRequestException,
      );
    });

    it('COMPANY_ADMIN uses jwt companyId, ignores dto companyId', async () => {
      const dto = { name: 'Test', companyId: 'different-company' };
      mockSportEventService.create.mockResolvedValue(mockEvent);

      await controller.create(dto as any, companyAdminReq as any);

      expect(mockSportEventService.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-uuid-1' }),
      );
    });
  });

  describe('findAll', () => {
    it('delegates filters to service', async () => {
      const query = { sportType: 'trail', country: 'Spain' };
      mockSportEventService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll(query as any);

      expect(mockSportEventService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockEvent]);
    });

    it('passes empty query when no filters', async () => {
      mockSportEventService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll({});

      expect(mockSportEventService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('getFilterOptions', () => {
    it('delegates to service without country', async () => {
      const options = {
        sportTypes: ['trail'],
        countries: ['Spain'],
        regions: [],
      };
      mockSportEventService.getFilterOptions.mockResolvedValue(options);

      const result = await controller.getFilterOptions();

      expect(mockSportEventService.getFilterOptions).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toEqual(options);
    });

    it('passes country to service when provided', async () => {
      const options = {
        sportTypes: [],
        countries: [],
        regions: ['Community of Madrid'],
      };
      mockSportEventService.getFilterOptions.mockResolvedValue(options);

      const result = await controller.getFilterOptions('Spain');

      expect(mockSportEventService.getFilterOptions).toHaveBeenCalledWith(
        'Spain',
      );
      expect(result).toEqual(options);
    });
  });

  describe('findOne', () => {
    it('returns event when found', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne('uuid-1');

      expect(result).toEqual(mockEvent);
    });

    it('throws NotFoundException when not found', async () => {
      mockSportEventService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto = { city: 'Barcelona' };

    it('SUPER_ADMIN can update any event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);
      mockSportEventService.update.mockResolvedValue({
        ...mockEvent,
        city: 'Barcelona',
      });

      const result = await controller.update(
        'uuid-1',
        dto,
        superAdminReq as any,
      );

      expect(result).toMatchObject({ city: 'Barcelona' });
    });

    it('COMPANY_ADMIN can update own company event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);
      mockSportEventService.update.mockResolvedValue({
        ...mockEvent,
        city: 'Barcelona',
      });

      const result = await controller.update(
        'uuid-1',
        dto,
        companyAdminReq as any,
      );

      expect(result).toMatchObject({ city: 'Barcelona' });
    });

    it('COMPANY_ADMIN cannot update another company event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);

      await expect(
        controller.update('uuid-1', dto, otherCompanyAdminReq as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when event not found', async () => {
      mockSportEventService.findOne.mockResolvedValue(null);

      await expect(
        controller.update('nonexistent', dto, superAdminReq as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('delegates to service', async () => {
      mockSportEventService.remove.mockResolvedValue(undefined);

      await controller.remove('uuid-1');

      expect(mockSportEventService.remove).toHaveBeenCalledWith('uuid-1');
    });
  });
});
