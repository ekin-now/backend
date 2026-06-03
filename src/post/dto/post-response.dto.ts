import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '../entities/post-type.enum';

export class UserMiniDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;
}

export class SportEventMiniDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  sportType: string;

  @ApiPropertyOptional()
  bannerUrl?: string;
}

export class ActivityDataResponseDto {
  @ApiProperty()
  sport: string;

  @ApiPropertyOptional()
  distance?: number;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  pace?: string;

  @ApiPropertyOptional()
  elevation?: number;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty({ enum: PostType })
  type: PostType;

  @ApiPropertyOptional({ type: ActivityDataResponseDto })
  activityData?: ActivityDataResponseDto;

  @ApiPropertyOptional()
  sportEventId?: string;

  @ApiPropertyOptional({ type: SportEventMiniDto })
  sportEvent?: SportEventMiniDto;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: UserMiniDto })
  user: UserMiniDto;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  isLikedByMe: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: UserMiniDto })
  user: UserMiniDto;

  @ApiProperty()
  createdAt: Date;
}
