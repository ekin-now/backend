import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SportSubEventController } from './sport-sub-event.controller';
import { SportSubEventService } from '../service/sport-sub-event.service';
import { SportEventService } from '../../sport-event/service/sport-event.service';
import { SportSubEvent } from '../entities/sport-sub-event.entity';
import { SportSubEventStatus } from '../entities/sport-sub-evet-status.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';

const mockSubEvent: Partial<SportSubEvent> = {
  id: 'sub-uuid-1',
  sportEventId: 'event-uuid-1',
  name: 'Marathon 42K',
  status: SportSubEventStatus.DRAFT,
  capacity: 500,
};

const mockEvent = { id: 'event-uuid-1', companyId: 'company-uuid-1' };

const mockSportSubEventService = {
  create: jest.fn(),
  findByEvent: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockSportEventService = {
  findOne: jest.fn(),
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

describe('SportSubEventController', () => {
  let controller: SportSubEventController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SportSubEventController],
      providers: [
        { provide: SportSubEventService, useValue: mockSportSubEventService },
        { provide: SportEventService, useValue: mockSportEventService },
      ],
    }).compile();

    controller = module.get<SportSubEventController>(SportSubEventController);
  });

  describe('create', () => {
    const dto = { name: 'Marathon 42K', capacity: 500 };

    it('SUPER_ADMIN creates sub-event without ownership check', async () => {
      mockSportSubEventService.create.mockResolvedValue(mockSubEvent);

      await controller.create('event-uuid-1', dto as any, superAdminReq as any);

      expect(mockSportEventService.findOne).not.toHaveBeenCalled();
      expect(mockSportSubEventService.create).toHaveBeenCalledWith(
        'event-uuid-1',
        dto,
      );
    });

    it('COMPANY_ADMIN creates sub-event for own company event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);
      mockSportSubEventService.create.mockResolvedValue(mockSubEvent);

      await controller.create(
        'event-uuid-1',
        dto as any,
        companyAdminReq as any,
      );

      expect(mockSportSubEventService.create).toHaveBeenCalledWith(
        'event-uuid-1',
        dto,
      );
    });

    it('COMPANY_ADMIN throws ForbiddenException for another company event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);

      await expect(
        controller.create(
          'event-uuid-1',
          dto as any,
          otherCompanyAdminReq as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('COMPANY_ADMIN throws NotFoundException if event not found', async () => {
      mockSportEventService.findOne.mockResolvedValue(null);

      await expect(
        controller.create('nonexistent', dto as any, companyAdminReq as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns sub-events for event', async () => {
      mockSportSubEventService.findByEvent.mockResolvedValue([mockSubEvent]);

      const result = await controller.findAll('event-uuid-1');

      expect(mockSportSubEventService.findByEvent).toHaveBeenCalledWith(
        'event-uuid-1',
      );
      expect(result).toEqual([mockSubEvent]);
    });
  });

  describe('findOne', () => {
    it('returns sub-event when found', async () => {
      mockSportSubEventService.findOne.mockResolvedValue(mockSubEvent);

      const result = await controller.findOne('event-uuid-1', 'sub-uuid-1');

      expect(result).toEqual(mockSubEvent);
    });

    it('throws NotFoundException when not found', async () => {
      mockSportSubEventService.findOne.mockResolvedValue(null);

      await expect(
        controller.findOne('event-uuid-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { capacity: 600 };

    it('SUPER_ADMIN updates without ownership check', async () => {
      const updated = { ...mockSubEvent, capacity: 600 };
      mockSportSubEventService.update.mockResolvedValue(updated);

      const result = await controller.update(
        'event-uuid-1',
        'sub-uuid-1',
        dto,
        superAdminReq as any,
      );

      expect(mockSportEventService.findOne).not.toHaveBeenCalled();
      expect(result).toMatchObject({ capacity: 600 });
    });

    it('COMPANY_ADMIN updates sub-event of own company event', async () => {
      const updated = { ...mockSubEvent, capacity: 600 };
      mockSportEventService.findOne.mockResolvedValue(mockEvent);
      mockSportSubEventService.update.mockResolvedValue(updated);

      const result = await controller.update(
        'event-uuid-1',
        'sub-uuid-1',
        dto,
        companyAdminReq as any,
      );

      expect(result).toMatchObject({ capacity: 600 });
    });

    it('COMPANY_ADMIN throws ForbiddenException for another company event', async () => {
      mockSportEventService.findOne.mockResolvedValue(mockEvent);

      await expect(
        controller.update(
          'event-uuid-1',
          'sub-uuid-1',
          dto,
          otherCompanyAdminReq as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('COMPANY_ADMIN throws NotFoundException if event not found', async () => {
      mockSportEventService.findOne.mockResolvedValue(null);

      await expect(
        controller.update(
          'nonexistent',
          'sub-uuid-1',
          dto,
          companyAdminReq as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('delegates to service', async () => {
      mockSportSubEventService.remove.mockResolvedValue(undefined);

      await controller.remove('sub-uuid-1');

      expect(mockSportSubEventService.remove).toHaveBeenCalledWith(
        'sub-uuid-1',
      );
    });
  });
});
