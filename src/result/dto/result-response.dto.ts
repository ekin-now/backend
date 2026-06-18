import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultStatus } from '../entities/result-status.enum';

export class ResultResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() participantId: string;
  @ApiProperty() sportEventId: string;
  @ApiProperty() subEventId: string;
  @ApiPropertyOptional() position?: number;
  @ApiPropertyOptional() finishTimeSeconds?: number;
  @ApiPropertyOptional() bibNumber?: number;
  @ApiProperty({ enum: ResultStatus }) status: ResultStatus;
  @ApiPropertyOptional() category?: string;
  @ApiPropertyOptional() categoryPosition?: number;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
