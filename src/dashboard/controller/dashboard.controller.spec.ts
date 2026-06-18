import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../service/dashboard.service';
import { UserRole } from '../../auth/decorators/userRole.enum';

const mockStats = {
  activeEvents: 3,
  upcomingEvents: 5,
  totalParticipants: 120,
  pendingRegistrations: 8,
  monthlyRevenue: 2400,
  failedPayments: 1,
  revenueByMonth: [],
  registrationsByMonth: [],
};

const mockService = {
  getStats: jest.fn(),
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
const staffReq = {
  user: {
    id: 'staff-id',
    role: UserRole.COMPANY_STAFF,
    companyId: 'company-1',
  },
};

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockService }],
    }).compile();

    controller = module.get(DashboardController);
  });

  describe('getStats', () => {
    it('SUPER_ADMIN gets global stats (no companyId)', async () => {
      mockService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(superAdminReq as any);

      expect(mockService.getStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockStats);
    });

    it('COMPANY_ADMIN gets company-scoped stats', async () => {
      mockService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(companyAdminReq as any);

      expect(mockService.getStats).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockStats);
    });

    it('COMPANY_STAFF gets company-scoped stats', async () => {
      mockService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(staffReq as any);

      expect(mockService.getStats).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockStats);
    });
  });
});
