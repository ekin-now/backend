import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { Registration } from '../../registration/entities/registration.entity';
import { Payment } from '../../payment/entities/payment.entity';

const mockQb: any = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
};

const makeRepo = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
});

describe('DashboardService', () => {
  let service: DashboardService;
  let eventRepo: ReturnType<typeof makeRepo>;
  let subEventRepo: ReturnType<typeof makeRepo>;
  let registrationRepo: ReturnType<typeof makeRepo>;
  let paymentRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    jest.clearAllMocks();

    eventRepo = makeRepo();
    subEventRepo = makeRepo();
    registrationRepo = makeRepo();
    paymentRepo = makeRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(SportEvent), useValue: eventRepo },
        { provide: getRepositoryToken(SportSubEvent), useValue: subEventRepo },
        {
          provide: getRepositoryToken(Registration),
          useValue: registrationRepo,
        },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getStats', () => {
    it('returns all stats for SUPER_ADMIN (no companyId)', async () => {
      mockQb.getCount.mockResolvedValue(5);
      mockQb.getRawOne.mockResolvedValue({ total: '1500' });
      mockQb.getRawMany.mockResolvedValue([{ month: '2026-01', value: '500' }]);

      const result = await service.getStats();

      expect(result).toMatchObject({
        activeEvents: 5,
        upcomingEvents: 5,
        totalParticipants: 1500,
        pendingRegistrations: 5,
        monthlyRevenue: 1500,
        failedPayments: 5,
        revenueByMonth: [{ month: '2026-01', value: 500 }],
        registrationsByMonth: [{ month: '2026-01', value: 500 }],
      });
    });

    it('scopes queries to companyId for COMPANY_ADMIN', async () => {
      mockQb.getCount.mockResolvedValue(2);
      mockQb.getRawOne.mockResolvedValue({ total: '800' });
      mockQb.getRawMany.mockResolvedValue([]);

      const result = await service.getStats('company-1');

      expect(result).toMatchObject({
        activeEvents: 2,
        monthlyRevenue: 800,
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('e.companyId = :companyId', {
        companyId: 'company-1',
      });
    });

    it('handles null/zero raw values gracefully', async () => {
      mockQb.getCount.mockResolvedValue(0);
      mockQb.getRawOne.mockResolvedValue({ total: null });
      mockQb.getRawMany.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.totalParticipants).toBe(0);
      expect(result.monthlyRevenue).toBe(0);
      expect(result.revenueByMonth).toEqual([]);
      expect(result.registrationsByMonth).toEqual([]);
    });

    it('parses revenueByMonth values as floats', async () => {
      mockQb.getCount.mockResolvedValue(0);
      mockQb.getRawOne.mockResolvedValue({ total: '0' });
      mockQb.getRawMany.mockResolvedValue([
        { month: '2026-05', value: '1234.56' },
        { month: '2026-06', value: '789.00' },
      ]);

      const result = await service.getStats();

      expect(result.revenueByMonth).toEqual([
        { month: '2026-05', value: 1234.56 },
        { month: '2026-06', value: 789 },
      ]);
    });

    it('parses registrationsByMonth values as integers', async () => {
      mockQb.getCount.mockResolvedValue(0);
      mockQb.getRawOne.mockResolvedValue({ total: '0' });
      mockQb.getRawMany.mockResolvedValue([
        { month: '2026-05', value: '12' },
        { month: '2026-06', value: '7' },
      ]);

      const result = await service.getStats();

      expect(result.registrationsByMonth).toEqual([
        { month: '2026-05', value: 12 },
        { month: '2026-06', value: 7 },
      ]);
    });
  });
});
