import {
  IsString,
  IsOptional,
  IsUrl,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSportEventDto {
  @ApiProperty({ example: 'Madrid Trail 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'madrid-trail-2025' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'The best trail race in Madrid' })
  @IsString()
  shortDescription: string;

  @ApiProperty({ example: 'Full description of the event...' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'trail' })
  @IsString()
  sportType: string;

  @ApiProperty({ example: '2025-06-15T08:00:00.000Z' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationOpenAt?: string;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  registrationCloseAt?: string;

  @ApiProperty({ example: 'Spain' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Community of Madrid' })
  @IsString()
  region: string;

  @ApiProperty({ example: 'Madrid' })
  @IsString()
  city: string;

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

  @ApiPropertyOptional({ example: 'uuid-company-id' })
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
