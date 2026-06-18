import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString, Min } from 'class-validator';
import { ResultStatus } from '../entities/result-status.enum';

export class UpdateResultDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  finishTimeSeconds?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  bibNumber?: number;

  @ApiPropertyOptional({ enum: ResultStatus })
  @IsEnum(ResultStatus)
  @IsOptional()
  status?: ResultStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  categoryPosition?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
