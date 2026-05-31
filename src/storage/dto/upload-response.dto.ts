import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'events/uuid.jpg' })
  key: string;

  @ApiProperty({ example: 'https://pub-xxx.r2.dev/events/uuid.jpg' })
  url: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ example: 'events/uuid.jpg' })
  key: string;

  @ApiProperty({
    example: 'https://bucket.r2.cloudflarestorage.com/events/uuid.jpg?...',
  })
  uploadUrl: string;

  @ApiProperty({ example: 'https://pub-xxx.r2.dev/events/uuid.jpg' })
  publicUrl: string;
}
