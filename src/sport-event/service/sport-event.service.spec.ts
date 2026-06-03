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

const mockQueryBuilder: any = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  clone: jest.fn(),
  getMany: jest.fn(),
  getRawMany: jest.fn(),
};

const mockRepository = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('SportEventService', () => {
  let service: SportEventService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);

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
    it('excludes DRAFT and CANCELLED events, orders by date', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockEvent]);

      const result = await service.findAll({});

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('e');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'e.status NOT IN (:...statuses)',
        expect.objectContaining({ statuses: expect.any(Array) }),
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'e.eventDate',
        'ASC',
      );
      expect(result).toEqual([mockEvent]);
    });

    it('applies sportType filter when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ sportType: 'trail' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'e.sportType = :sportType',
        { sportType: 'trail' },
      );
    });

    it('applies country + region filters when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({
        country: 'Spain',
        region: 'Community of Madrid',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'e.country = :country',
        { country: 'Spain' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'e.region = :region',
        { region: 'Community of Madrid' },
      );
    });

    it('applies date range filters when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'e.eventDate >= :dateFrom',
        { dateFrom: '2025-01-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'e.eventDate <= :dateTo',
        { dateTo: '2025-12-31' },
      );
    });
  });

  describe('getFilterOptions', () => {
    it('returns sorted sportTypes, countries, and empty regions when no country', async () => {
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ value: 'trail' }, { value: 'cycling' }])
        .mockResolvedValueOnce([{ value: 'Spain' }, { value: 'France' }]);

      const result = await service.getFilterOptions();

      expect(result.sportTypes).toEqual(['cycling', 'trail']);
      expect(result.countries).toEqual(['France', 'Spain']);
      expect(result.regions).toEqual([]);
    });

    it('returns regions when country provided', async () => {
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ value: 'trail' }])
        .mockResolvedValueOnce([{ value: 'Spain' }])
        .mockResolvedValueOnce([{ value: 'Catalonia' }, { value: 'Aragon' }]);

      const result = await service.getFilterOptions('Spain');

      expect(result.regions).toEqual(['Aragon', 'Catalonia']);
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
