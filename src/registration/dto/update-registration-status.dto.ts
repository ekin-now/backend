import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationStatus } from '../entities/registration-status.enum';

export class UpdateRegistrationStatusDto {
  @ApiProperty({ enum: RegistrationStatus })
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
