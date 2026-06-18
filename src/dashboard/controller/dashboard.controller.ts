import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardService } from '../service/dashboard.service';
import { DashboardStatsResponseDto } from '../dto/dashboard-stats-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

interface AuthUser {
  id: string;
  role: UserRole;
  companyId?: string;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_STAFF)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOkResponse({ type: DashboardStatsResponseDto })
  @ApiUnauthorizedResponse()
  @Get('stats')
  getStats(@Request() req: { user: AuthUser }) {
    const companyId =
      req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.companyId;
    return this.dashboardService.getStats(companyId);
  }
}
