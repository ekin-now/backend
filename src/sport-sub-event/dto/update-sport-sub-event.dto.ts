import {
  IsString,
  IsOptional,
  IsUrl,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SportSubEventStatus } from '../entities/sport-sub-evet-status.enum';

export class UpdateSportSubEventDto {
  @ApiPropertyOptional({ example: 'Marathon 42K' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Classic 42km road race' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Full description...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: SportSubEventStatus,
    example: SportSubEventStatus.REGISTRATION_OPEN,
  })
  @IsOptional()
  @IsEnum(SportSubEventStatus)
  status?: SportSubEventStatus;

  @ApiPropertyOptional({ example: 42.195 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @IsInt()
  @Min(0)
  elevationGainMeters?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ example: 45.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2025-06-15T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDateTime?: string;

  @ApiPropertyOptional({ example: 360 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumAge?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maximumAge?: number;

  @ApiPropertyOptional({ example: 'https://example.com/route.gpx' })
  @IsOptional()
  @IsUrl()
  gpxUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  bibNumberRequired?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  bibStartNumber?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  bibEndNumber?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationOpenAt?: string;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationCloseAt?: string;
}
