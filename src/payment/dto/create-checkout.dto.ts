import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty()
  @IsUUID()
  registrationId: string;

  @ApiProperty({ description: 'Amount in smallest currency unit (cents)' })
  @IsNumber()
  @Min(50)
  amount: number;

  @ApiPropertyOptional({ default: 'eur' })
  @IsString()
  @IsOptional()
  currency?: string;
}
