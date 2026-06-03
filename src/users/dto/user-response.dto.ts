import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../auth/decorators/userRole.enum';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-1' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  username?: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiPropertyOptional({ example: '+34600000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  birthDate?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiPropertyOptional({ example: 'male' })
  gender?: string;

  @ApiPropertyOptional({ example: 'Spain' })
  country?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  city?: string;

  @ApiPropertyOptional({ example: 'Sports enthusiast' })
  bio?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  instagram?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  strava?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PARTICIPANT })
  role: UserRole;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
