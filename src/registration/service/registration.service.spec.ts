import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { Registration } from '../entities/registration.entity';
import { RegistrationStatus } from '../entities/registration-status.enum';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { SportEventStatus } from '../../sport-event/entities/sport.event-status.enum';

const mockSubEvent: Partial<SportSubEvent> = {
  id: 'sub-1',
  sportEventId: 'event-1',
  capacity: 100,
  registeredParticipants: 50,
  sportEvent: { status: SportEventStatus.REGISTRATION_OPEN } as any,
};

const mockReg: Partial<Registration> = {
  id: 'reg-1',
  participantId: 'user-1',
  sportEventId: 'event-1',
  subEventId: 'sub-1',
  status: RegistrationStatus.PENDING,
};

const mockQb: any = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getRawMany: jest.fn(),
};

const mockRegRepo = {
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

const mockSubEventRepo = {
  findOne: jest.fn(),
  increment: jest.fn(),
  decrement: jest.fn(),
};

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: getRepositoryToken(Registration), useValue: mockRegRepo },
        {
          provide: getRepositoryToken(SportSubEvent),
          useValue: mockSubEventRepo,
        },
      ],
    }).compile();

    service = module.get(RegistrationService);
  });

  describe('create', () => {
    const dto = { subEventId: 'sub-1' };

    it('creates PENDING registration when capacity available', async () => {
      mockSubEventRepo.findOne.mockResolvedValue(mockSubEvent);
      mockRegRepo.findOneBy.mockResolvedValue(null);
      mockRegRepo.create.mockReturnValue(mockReg);
      mockRegRepo.save.mockResolvedValue(mockReg);

      const result = await service.create('user-1', dto);

      expect(mockRegRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: RegistrationStatus.PENDING }),
      );
      expect(result).toEqual(mockReg);
    });

    it('creates WAITLIST registration when sub-event is full', async () => {
      const fullSubEvent = {
        ...mockSubEvent,
        capacity: 50,
        registeredParticipants: 50,
      };
      mockSubEventRepo.findOne.mockResolvedValue(fullSubEvent);
      mockRegRepo.findOneBy.mockResolvedValue(null);
      mockRegRepo.create.mockReturnValue({
        ...mockReg,
        status: RegistrationStatus.WAITLIST,
      });
      mockRegRepo.save.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.WAITLIST,
      });

      await service.create('user-1', dto);

      expect(mockRegRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: RegistrationStatus.WAITLIST }),
      );
    });

    it('throws NotFoundException when sub-event not found', async () => {
      mockSubEventRepo.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when event is cancelled', async () => {
      const cancelledSub = {
        ...mockSubEvent,
        sportEvent: { status: SportEventStatus.CANCELLED },
      };
      mockSubEventRepo.findOne.mockResolvedValue(cancelledSub);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when already registered', async () => {
      mockSubEventRepo.findOne.mockResolvedValue(mockSubEvent);
      mockRegRepo.findOneBy.mockResolvedValue(mockReg);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('returns registration when found', async () => {
      mockRegRepo.findOne.mockResolvedValue(mockReg);

      const result = await service.findOne('reg-1');

      expect(result).toEqual(mockReg);
    });

    it('throws NotFoundException when not found', async () => {
      mockRegRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('increments registeredParticipants when approving', async () => {
      const pending = { ...mockReg, status: RegistrationStatus.PENDING };
      const approved = { ...mockReg, status: RegistrationStatus.APPROVED };
      mockRegRepo.findOne
        .mockResolvedValueOnce(pending)
        .mockResolvedValueOnce(approved);
      mockRegRepo.save.mockResolvedValue(approved);

      await service.updateStatus('reg-1', {
        status: RegistrationStatus.APPROVED,
      });

      expect(mockSubEventRepo.increment).toHaveBeenCalledWith(
        { id: 'sub-1' },
        'registeredParticipants',
        1,
      );
    });

    it('decrements registeredParticipants when revoking approval', async () => {
      const approved = { ...mockReg, status: RegistrationStatus.APPROVED };
      const rejected = { ...mockReg, status: RegistrationStatus.REJECTED };
      mockRegRepo.findOne
        .mockResolvedValueOnce(approved)
        .mockResolvedValueOnce(rejected);
      mockRegRepo.save.mockResolvedValue(rejected);

      await service.updateStatus('reg-1', {
        status: RegistrationStatus.REJECTED,
      });

      expect(mockSubEventRepo.decrement).toHaveBeenCalledWith(
        { id: 'sub-1' },
        'registeredParticipants',
        1,
      );
    });

    it('does not change counter when status unchanged (PENDING → WAITLIST)', async () => {
      const pending = { ...mockReg, status: RegistrationStatus.PENDING };
      mockRegRepo.findOne.mockResolvedValue(pending);
      mockRegRepo.save.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.WAITLIST,
      });

      await service.updateStatus('reg-1', {
        status: RegistrationStatus.WAITLIST,
      });

      expect(mockSubEventRepo.increment).not.toHaveBeenCalled();
      expect(mockSubEventRepo.decrement).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels own registration', async () => {
      mockRegRepo.findOne.mockResolvedValue({ ...mockReg });
      mockRegRepo.save.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.CANCELLED,
      });

      await service.cancel('reg-1', 'user-1');

      expect(mockRegRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: RegistrationStatus.CANCELLED }),
      );
    });

    it('decrements counter when cancelling an approved registration', async () => {
      const approved = { ...mockReg, status: RegistrationStatus.APPROVED };
      mockRegRepo.findOne.mockResolvedValue(approved);
      mockRegRepo.save.mockResolvedValue({
        ...approved,
        status: RegistrationStatus.CANCELLED,
      });

      await service.cancel('reg-1', 'user-1');

      expect(mockSubEventRepo.decrement).toHaveBeenCalledWith(
        { id: 'sub-1' },
        'registeredParticipants',
        1,
      );
    });

    it('throws BadRequestException when not the owner', async () => {
      mockRegRepo.findOne.mockResolvedValue({
        ...mockReg,
        participantId: 'other-user',
      });

      await expect(service.cancel('reg-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when already cancelled', async () => {
      mockRegRepo.findOne.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.CANCELLED,
      });

      await expect(service.cancel('reg-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('decrements counter when removing an approved registration', async () => {
      const approved = { ...mockReg, status: RegistrationStatus.APPROVED };
      mockRegRepo.findOne.mockResolvedValue(approved);
      mockRegRepo.remove.mockResolvedValue(undefined);

      await service.remove('reg-1');

      expect(mockSubEventRepo.decrement).toHaveBeenCalledWith(
        { id: 'sub-1' },
        'registeredParticipants',
        1,
      );
    });

    it('does not decrement counter for non-approved registration', async () => {
      mockRegRepo.findOne.mockResolvedValue({
        ...mockReg,
        status: RegistrationStatus.PENDING,
      });
      mockRegRepo.remove.mockResolvedValue(undefined);

      await service.remove('reg-1');

      expect(mockSubEventRepo.decrement).not.toHaveBeenCalled();
    });
  });
});
