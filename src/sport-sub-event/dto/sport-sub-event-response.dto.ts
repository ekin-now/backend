import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SportSubEventStatus } from '../entities/sport-sub-evet-status.enum';

export class SportSubEventResponseDto {
  @ApiProperty({ example: 'uuid-1' })
  id: string;

  @ApiProperty({ example: 'uuid-event-1' })
  sportEventId: string;

  @ApiProperty({ example: 'Marathon 42K' })
  name: string;

  @ApiProperty({ example: 'Classic 42km road race' })
  shortDescription: string;

  @ApiProperty({ example: 'Full description...' })
  description: string;

  @ApiProperty({
    enum: SportSubEventStatus,
    example: SportSubEventStatus.DRAFT,
  })
  status: SportSubEventStatus;

  @ApiPropertyOptional({ example: 42.195 })
  distanceKm?: number;

  @ApiPropertyOptional({ example: 350 })
  elevationGainMeters?: number;

  @ApiProperty({ example: 500 })
  capacity: number;

  @ApiProperty({ example: 0 })
  registeredParticipants: number;

  @ApiProperty({ example: 45.0 })
  price: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ example: '2025-06-15T08:00:00.000Z' })
  startDateTime: Date;

  @ApiPropertyOptional({ example: 360 })
  timeLimitMinutes?: number;

  @ApiPropertyOptional({ example: 18 })
  minimumAge?: number;

  @ApiPropertyOptional({ example: 70 })
  maximumAge?: number;

  @ApiPropertyOptional({ example: 'https://example.com/route.gpx' })
  gpxUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  coverImageUrl?: string;

  @ApiProperty({ example: false })
  bibNumberRequired: boolean;

  @ApiPropertyOptional({ example: 1 })
  bibStartNumber?: number;

  @ApiPropertyOptional({ example: 500 })
  bibEndNumber?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  registrationOpenAt?: Date;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  registrationCloseAt?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
