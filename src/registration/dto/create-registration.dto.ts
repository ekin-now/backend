import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty()
  @IsUUID()
  subEventId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
