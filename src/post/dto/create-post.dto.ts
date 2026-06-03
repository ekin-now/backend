import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PostType } from '../entities/post-type.enum';

export class ActivityDataDto {
  @ApiProperty()
  @IsString()
  sport: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pace?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  elevation?: number;
}

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ enum: PostType })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ type: ActivityDataDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ActivityDataDto)
  activityData?: ActivityDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sportEventId?: string;
}
