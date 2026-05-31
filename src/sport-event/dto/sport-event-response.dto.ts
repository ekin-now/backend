import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportEventStatus } from '../entities/sport.event-status.enum';

export class SportEventResponseDto {
  @ApiProperty({ example: 'uuid-1' })
  id: string;

  @ApiProperty({ example: 'madrid-trail-2025' })
  slug: string;

  @ApiProperty({ example: 'Madrid Trail 2025' })
  name: string;

  @ApiProperty({ example: 'The best trail race in Madrid' })
  shortDescription: string;

  @ApiProperty({ example: 'Full description...' })
  description: string;

  @ApiProperty({ example: 'trail' })
  sportType: string;

  @ApiProperty({ enum: SportEventStatus, example: SportEventStatus.DRAFT })
  status: SportEventStatus;

  @ApiProperty({ example: '2025-06-15T08:00:00.000Z' })
  eventDate: Date;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  registrationOpenAt?: Date;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  registrationCloseAt?: Date;

  @ApiProperty({ example: 'Spain' })
  country: string;

  @ApiProperty({ example: 'Community of Madrid' })
  region: string;

  @ApiProperty({ example: 'Madrid' })
  city: string;

  @ApiPropertyOptional({ example: 'Calle Gran Vía 1' })
  address?: string;

  @ApiPropertyOptional({ example: 40.4168 })
  latitude?: number;

  @ApiPropertyOptional({ example: -3.7038 })
  longitude?: number;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/rules.pdf' })
  rulesDocumentUrl?: string;

  @ApiProperty({ example: false })
  featured: boolean;

  @ApiProperty({ example: 'uuid-company-id' })
  companyId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
