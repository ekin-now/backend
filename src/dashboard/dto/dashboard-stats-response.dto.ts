import { ApiProperty } from '@nestjs/swagger';

export class MonthlyDataPointDto {
  @ApiProperty() month: string;
  @ApiProperty() value: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty() activeEvents: number;
  @ApiProperty() upcomingEvents: number;
  @ApiProperty() totalParticipants: number;
  @ApiProperty() pendingRegistrations: number;
  @ApiProperty() monthlyRevenue: number;
  @ApiProperty() failedPayments: number;
  @ApiProperty({ type: [MonthlyDataPointDto] })
  revenueByMonth: MonthlyDataPointDto[];
  @ApiProperty({ type: [MonthlyDataPointDto] })
  registrationsByMonth: MonthlyDataPointDto[];
}
