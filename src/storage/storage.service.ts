import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type AssetType = 'events' | 'sub-events' | 'companies' | 'users' | 'gpx';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_GPX_TYPES = [
  'application/gpx+xml',
  'text/xml',
  'application/xml',
];

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/gpx+xml': 'gpx',
  'text/xml': 'xml',
  'application/xml': 'xml',
};

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = config.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(
    file: Express.Multer.File,
    assetType: AssetType,
  ): Promise<{ key: string; url: string }> {
    const ext = this.getExtension(file.originalname);
    const key = `${assetType}/${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { key, url: `${this.publicUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getPresignedUploadUrl(
    assetType: AssetType,
    contentType: string,
    ext: string,
  ): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
    const key = `${assetType}/${uuidv4()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );

    return { key, uploadUrl, publicUrl: `${this.publicUrl}/${key}` };
  }

  isAllowedMimeType(mimeType: string, assetType: AssetType): boolean {
    if (assetType === 'gpx') return ALLOWED_GPX_TYPES.includes(mimeType);
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
  }

  extFromContentType(contentType: string): string {
    return CONTENT_TYPE_TO_EXT[contentType] ?? 'bin';
  }

  private getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? 'bin';
  }
}
