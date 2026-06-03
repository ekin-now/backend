import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({ example: 'uuid-1' })
  id: string;

  @ApiProperty({ example: 'Ekinnow Sports' })
  name: string;

  @ApiProperty({ example: 'ekinnow-sports' })
  slug: string;

  @ApiPropertyOptional({ example: 'Sports company focused on running' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://ekinnow.com' })
  website?: string;

  @ApiPropertyOptional({ example: 'info@ekinnow.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+34600000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'Spain' })
  country?: string;

  @ApiPropertyOptional({ example: 'Madrid' })
  city?: string;

  @ApiPropertyOptional({ example: 'Calle Gran Vía 1' })
  address?: string;

  @ApiPropertyOptional({ example: 'running' })
  sportType?: string;

  @ApiPropertyOptional({ example: 'club' })
  companyType?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
