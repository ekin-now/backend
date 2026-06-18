import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegistrationStatus } from '../entities/registration-status.enum';

export class RegistrationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() participantId: string;
  @ApiProperty() sportEventId: string;
  @ApiProperty() subEventId: string;
  @ApiProperty({ enum: RegistrationStatus }) status: RegistrationStatus;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
