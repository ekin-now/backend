import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResultService } from './result.service';
import { Result } from '../entities/result.entity';
import { ResultStatus } from '../entities/result-status.enum';

const mockResult: Partial<Result> = {
  id: 'res-1',
  participantId: 'user-1',
  sportEventId: 'event-1',
  subEventId: 'sub-1',
  position: 1,
  finishTimeSeconds: 3600,
  bibNumber: 42,
  status: ResultStatus.FINISHED,
};

const mockQb: any = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
};

describe('ResultService', () => {
  let service: ResultService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultService,
        { provide: getRepositoryToken(Result), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(ResultService);
  });

  describe('create', () => {
    it('creates and saves a result', async () => {
      mockRepo.create.mockReturnValue(mockResult);
      mockRepo.save.mockResolvedValue(mockResult);

      const result = await service.create({ participantId: 'user-1' } as any);

      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkCreate', () => {
    it('creates and saves multiple results', async () => {
      const results = [mockResult, { ...mockResult, id: 'res-2', position: 2 }];
      mockRepo.create.mockImplementation((r) => r);
      mockRepo.save.mockResolvedValue(results);

      const dto = {
        results: [{ participantId: 'user-1' }, { participantId: 'user-2' }],
      } as any;
      const result = await service.bulkCreate(dto);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(results);
    });
  });

  describe('findAll', () => {
    it('returns results ordered by position', async () => {
      mockQb.getMany.mockResolvedValue([mockResult]);

      const result = await service.findAll({});

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('r');
      expect(mockQb.orderBy).toHaveBeenCalledWith('r.position', 'ASC');
      expect(result).toEqual([mockResult]);
    });

    it('applies sportEventId filter', async () => {
      mockQb.getMany.mockResolvedValue([mockResult]);

      await service.findAll({ sportEventId: 'event-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'r.sportEventId = :sportEventId',
        { sportEventId: 'event-1' },
      );
    });

    it('applies subEventId filter', async () => {
      mockQb.getMany.mockResolvedValue([]);

      await service.findAll({ subEventId: 'sub-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'r.subEventId = :subEventId',
        { subEventId: 'sub-1' },
      );
    });

    it('applies participantId filter', async () => {
      mockQb.getMany.mockResolvedValue([mockResult]);

      await service.findAll({ participantId: 'user-1' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'r.participantId = :participantId',
        { participantId: 'user-1' },
      );
    });
  });

  describe('findOne', () => {
    it('returns result when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockResult);

      const result = await service.findOne('res-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'res-1' } }),
      );
      expect(result).toEqual(mockResult);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates result fields and saves', async () => {
      const updated = { ...mockResult, position: 2 };
      mockRepo.findOne.mockResolvedValue({ ...mockResult });
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update('res-1', { position: 2 } as any);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ position: 2 }),
      );
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when result not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes result', async () => {
      mockRepo.findOne.mockResolvedValue(mockResult);
      mockRepo.remove.mockResolvedValue(undefined);

      await service.remove('res-1');

      expect(mockRepo.remove).toHaveBeenCalledWith(mockResult);
    });

    it('throws NotFoundException when result not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
