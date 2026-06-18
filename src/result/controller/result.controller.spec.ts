import { Test, TestingModule } from '@nestjs/testing';
import { ResultController } from './result.controller';
import { ResultService } from '../service/result.service';
import { ResultStatus } from '../entities/result-status.enum';
import { Result } from '../entities/result.entity';

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

const mockService = {
  create: jest.fn(),
  bulkCreate: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ResultController', () => {
  let controller: ResultController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultController],
      providers: [{ provide: ResultService, useValue: mockService }],
    }).compile();

    controller = module.get(ResultController);
  });

  describe('create', () => {
    it('delegates to service', async () => {
      mockService.create.mockResolvedValue(mockResult);

      const result = await controller.create({
        participantId: 'user-1',
      } as any);

      expect(mockService.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkCreate', () => {
    it('delegates to service', async () => {
      const results = [mockResult];
      mockService.bulkCreate.mockResolvedValue(results);

      const result = await controller.bulkCreate({ results: [] } as any);

      expect(mockService.bulkCreate).toHaveBeenCalled();
      expect(result).toEqual(results);
    });
  });

  describe('findAll', () => {
    it('passes filters to service', async () => {
      mockService.findAll.mockResolvedValue([mockResult]);

      const result = await controller.findAll('event-1', 'sub-1', 'user-1');

      expect(mockService.findAll).toHaveBeenCalledWith({
        sportEventId: 'event-1',
        subEventId: 'sub-1',
        participantId: 'user-1',
      });
      expect(result).toEqual([mockResult]);
    });

    it('passes undefined filters when not provided', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalledWith({
        sportEventId: undefined,
        subEventId: undefined,
        participantId: undefined,
      });
    });
  });

  describe('findOne', () => {
    it('returns result by id', async () => {
      mockService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('res-1');

      expect(mockService.findOne).toHaveBeenCalledWith('res-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('delegates to service with id and dto', async () => {
      const updated = { ...mockResult, position: 2 };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update('res-1', { position: 2 } as any);

      expect(mockService.update).toHaveBeenCalledWith('res-1', { position: 2 });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('delegates to service', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('res-1');

      expect(mockService.remove).toHaveBeenCalledWith('res-1');
    });
  });
});
