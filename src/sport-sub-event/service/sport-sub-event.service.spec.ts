import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SportSubEventService } from './sport-sub-event.service';
import { SportSubEvent } from '../entities/sport-sub-event.entity';
import { SportSubEventStatus } from '../entities/sport-sub-evet-status.enum';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';

const mockSubEvent: SportSubEvent = {
  id: 'sub-uuid-1',
  sportEventId: 'event-uuid-1',
  sportEvent: undefined,
  name: 'Marathon 42K',
  shortDescription: 'Classic road race',
  description: 'Full description',
  status: SportSubEventStatus.DRAFT,
  distanceKm: 42.195,
  elevationGainMeters: undefined,
  capacity: 500,
  registeredParticipants: 0,
  price: 45,
  currency: 'EUR',
  startDateTime: new Date('2025-06-15T08:00:00.000Z'),
  timeLimitMinutes: undefined,
  minimumAge: undefined,
  maximumAge: undefined,
  gpxUrl: undefined,
  coverImageUrl: undefined,
  bibNumberRequired: false,
  bibStartNumber: undefined,
  bibEndNumber: undefined,
  registrationOpenAt: undefined,
  registrationCloseAt: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubEventRepo = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockSportEventRepo = {
  findOneBy: jest.fn(),
};

describe('SportSubEventService', () => {
  let service: SportSubEventService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportSubEventService,
        {
          provide: getRepositoryToken(SportSubEvent),
          useValue: mockSubEventRepo,
        },
        {
          provide: getRepositoryToken(SportEvent),
          useValue: mockSportEventRepo,
        },
      ],
    }).compile();

    service = module.get(SportSubEventService);
  });

  describe('create', () => {
    const dto = {
      name: 'Marathon 42K',
      capacity: 500,
      startDateTime: '2025-06-15T08:00:00Z',
    };

    it('creates sub-event for valid event', async () => {
      mockSportEventRepo.findOneBy.mockResolvedValue({ id: 'event-uuid-1' });
      mockSubEventRepo.create.mockReturnValue(mockSubEvent);
      mockSubEventRepo.save.mockResolvedValue(mockSubEvent);

      const result = await service.create('event-uuid-1', dto as any);

      expect(mockSubEventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sportEventId: 'event-uuid-1' }),
      );
      expect(result).toEqual(mockSubEvent);
    });

    it('throws NotFoundException if event not found', async () => {
      mockSportEventRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create('nonexistent', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEvent', () => {
    it('excludes DRAFT and CANCELLED sub-events', async () => {
      mockSubEventRepo.findBy.mockResolvedValue([mockSubEvent]);

      const result = await service.findByEvent('event-uuid-1');

      expect(mockSubEventRepo.findBy).toHaveBeenCalledWith(
        expect.objectContaining({ sportEventId: 'event-uuid-1' }),
      );
      expect(result).toEqual([mockSubEvent]);
    });
  });

  describe('findOne', () => {
    it('returns sub-event by eventId and id', async () => {
      mockSubEventRepo.findOneBy.mockResolvedValue(mockSubEvent);

      const result = await service.findOne('event-uuid-1', 'sub-uuid-1');

      expect(mockSubEventRepo.findOneBy).toHaveBeenCalledWith({
        id: 'sub-uuid-1',
        sportEventId: 'event-uuid-1',
      });
      expect(result).toEqual(mockSubEvent);
    });

    it('returns null when not found', async () => {
      mockSubEventRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('event-uuid-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns sub-event', async () => {
      const updated = { ...mockSubEvent, capacity: 600 };
      mockSubEventRepo.findOneBy.mockResolvedValue({ ...mockSubEvent });
      mockSubEventRepo.save.mockResolvedValue(updated);

      const result = await service.update('sub-uuid-1', { capacity: 600 });

      expect(result).toMatchObject({ capacity: 600 });
    });

    it('throws NotFoundException when not found', async () => {
      mockSubEventRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('sets status to CANCELLED', async () => {
      mockSubEventRepo.findOneBy.mockResolvedValue({ ...mockSubEvent });
      mockSubEventRepo.save.mockResolvedValue({
        ...mockSubEvent,
        status: SportSubEventStatus.CANCELLED,
      });

      await service.remove('sub-uuid-1');

      expect(mockSubEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SportSubEventStatus.CANCELLED }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      mockSubEventRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
