import {
  IsString,
  IsOptional,
  IsUrl,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SportEventStatus } from '../entities/sport.event-status.enum';

export class UpdateSportEventDto {
  @ApiPropertyOptional({ example: 'Madrid Trail 2025' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'The best trail race in Madrid' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Full description of the event...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'trail' })
  @IsOptional()
  @IsString()
  sportType?: string;

  @ApiPropertyOptional({
    enum: SportEventStatus,
    example: SportEventStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(SportEventStatus)
  status?: SportEventStatus;

  @ApiPropertyOptional({ example: '2025-06-15T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationOpenAt?: string;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationCloseAt?: string;

  @ApiPropertyOptional({ example: 'Spain' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Community of Madrid' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Calle Gran Vía 1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 40.4168 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -3.7038 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/rules.pdf' })
  @IsOptional()
  @IsUrl()
  rulesDocumentUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
