import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SportEventService } from './sport-event.service';
import { SportEvent } from '../entities/sport-event.entity';
import { SportEventStatus } from '../entities/sport.event-status.enum';

const mockEvent: SportEvent = {
  id: 'uuid-1',
  slug: 'madrid-trail-2025',
  name: 'Madrid Trail 2025',
  shortDescription: 'Great trail race',
  description: 'Full description',
  sportType: 'trail',
  status: SportEventStatus.DRAFT,
  eventDate: new Date('2025-06-15'),
  registrationOpenAt: undefined,
  registrationCloseAt: undefined,
  country: 'Spain',
  region: 'Community of Madrid',
  city: 'Madrid',
  address: undefined,
  latitude: undefined,
  longitude: undefined,
  bannerUrl: undefined,
  logoUrl: undefined,
  websiteUrl: undefined,
  rulesDocumentUrl: undefined,
  featured: false,
  company: undefined,
  companyId: 'company-uuid-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('SportEventService', () => {
  let service: SportEventService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportEventService,
        { provide: getRepositoryToken(SportEvent), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(SportEventService);
  });

  describe('create', () => {
    const dto = { name: 'Madrid Trail 2025', companyId: 'company-uuid-1' };

    it('creates event with auto-generated slug', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.create(dto as any);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'madrid-trail-2025' }),
      );
      expect(result).toEqual(mockEvent);
    });

    it('uses provided slug over auto-generated', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      await service.create({ ...dto, slug: 'custom-slug' } as any);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });

    it('throws ConflictException if slug exists', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEvent);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('excludes DRAFT and CANCELLED events', async () => {
      mockRepository.findBy.mockResolvedValue([mockEvent]);

      const result = await service.findAll();

      expect(mockRepository.findBy).toHaveBeenCalledWith(
        expect.objectContaining({ status: expect.anything() }),
      );
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findOne', () => {
    it('returns event by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockEvent);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockEvent);
    });

    it('returns null when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns event', async () => {
      const updated = { ...mockEvent, city: 'Barcelona' };
      mockRepository.findOneBy.mockResolvedValue({ ...mockEvent });
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { city: 'Barcelona' });

      expect(result).toMatchObject({ city: 'Barcelona' });
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('sets status to CANCELLED', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockEvent });
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        status: SportEventStatus.CANCELLED,
      });

      await service.remove('uuid-1');

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: SportEventStatus.CANCELLED }),
      );
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
