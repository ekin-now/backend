import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class FollowResponseDto {
  @ApiProperty()
  followerId: string;

  @ApiProperty()
  followingId: string;

  @ApiProperty({ type: UserMiniDto })
  user: UserMiniDto;

  @ApiProperty()
  createdAt: Date;
}
