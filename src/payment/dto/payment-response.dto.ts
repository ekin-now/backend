import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment-status.enum';
import { PaymentMethod } from '../entities/payment-method.enum';

export class PaymentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() registrationId: string;
  @ApiProperty() participantId: string;
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
  @ApiProperty({ enum: PaymentMethod }) method: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus }) status: PaymentStatus;
  @ApiPropertyOptional() transactionId?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
