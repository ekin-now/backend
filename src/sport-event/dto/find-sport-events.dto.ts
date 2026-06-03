import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindSportEventsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sportType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'ISO date string, e.g. 2025-06-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO date string, e.g. 2025-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
