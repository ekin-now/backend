import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      R2_ACCOUNT_ID: 'test-account',
      R2_BUCKET_NAME: 'test-bucket',
      R2_PUBLIC_URL: 'https://pub-test.r2.dev',
      R2_ACCESS_KEY_ID: 'test-key-id',
      R2_SECRET_ACCESS_KEY: 'test-secret',
    };
    return values[key];
  }),
};

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://presigned-url.example.com'),
}));

jest.mock('uuid', () => ({ v4: () => 'fixed-uuid' }));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('upload', () => {
    it('returns key and public url', async () => {
      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      const result = await service.upload(file, 'events');

      expect(result.key).toBe('events/fixed-uuid.jpg');
      expect(result.url).toBe('https://pub-test.r2.dev/events/fixed-uuid.jpg');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('returns key, uploadUrl and publicUrl', async () => {
      const result = await service.getPresignedUploadUrl(
        'events',
        'image/jpeg',
        'jpg',
      );

      expect(result.key).toBe('events/fixed-uuid.jpg');
      expect(result.uploadUrl).toBe('https://presigned-url.example.com');
      expect(result.publicUrl).toBe(
        'https://pub-test.r2.dev/events/fixed-uuid.jpg',
      );
    });
  });

  describe('isAllowedMimeType', () => {
    it('allows images for events', () => {
      expect(service.isAllowedMimeType('image/jpeg', 'events')).toBe(true);
      expect(service.isAllowedMimeType('image/png', 'events')).toBe(true);
      expect(service.isAllowedMimeType('image/webp', 'events')).toBe(true);
    });

    it('rejects non-image for events', () => {
      expect(service.isAllowedMimeType('application/gpx+xml', 'events')).toBe(
        false,
      );
    });

    it('allows gpx types for gpx asset type', () => {
      expect(service.isAllowedMimeType('application/gpx+xml', 'gpx')).toBe(
        true,
      );
      expect(service.isAllowedMimeType('text/xml', 'gpx')).toBe(true);
    });

    it('rejects images for gpx asset type', () => {
      expect(service.isAllowedMimeType('image/jpeg', 'gpx')).toBe(false);
    });
  });

  describe('extFromContentType', () => {
    it('returns correct extension for known types', () => {
      expect(service.extFromContentType('image/jpeg')).toBe('jpg');
      expect(service.extFromContentType('image/png')).toBe('png');
      expect(service.extFromContentType('image/webp')).toBe('webp');
      expect(service.extFromContentType('application/gpx+xml')).toBe('gpx');
      expect(service.extFromContentType('text/xml')).toBe('xml');
    });

    it('returns bin for unknown types', () => {
      expect(service.extFromContentType('application/octet-stream')).toBe(
        'bin',
      );
    });
  });

  describe('delete', () => {
    it('calls DeleteObjectCommand with correct key', async () => {
      await expect(service.delete('events/uuid.jpg')).resolves.toBeUndefined();
    });
  });
});
