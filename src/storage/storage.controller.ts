import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { StorageService, AssetType } from './storage.service';
import {
  UploadResponseDto,
  PresignedUrlResponseDto,
} from './dto/upload-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/decorators/userRole.enum';

const ASSET_TYPES: AssetType[] = [
  'events',
  'sub-events',
  'companies',
  'users',
  'gpx',
];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

@ApiTags('storage')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiCreatedResponse({ type: UploadResponseDto })
  @ApiUnauthorizedResponse()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'type', enum: ASSET_TYPES })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_SIZE_BYTES })],
      }),
    )
    file: Express.Multer.File,
    @Query('type') assetType: AssetType,
  ) {
    if (!ASSET_TYPES.includes(assetType)) {
      throw new BadRequestException(
        `Invalid type. Must be one of: ${ASSET_TYPES.join(', ')}`,
      );
    }
    if (!this.storageService.isAllowedMimeType(file.mimetype, assetType)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed for ${assetType}`,
      );
    }
    return this.storageService.upload(file, assetType);
  }

  @ApiOkResponse({ type: PresignedUrlResponseDto })
  @ApiUnauthorizedResponse()
  @ApiQuery({ name: 'type', enum: ASSET_TYPES })
  @ApiQuery({ name: 'contentType', example: 'image/jpeg' })
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('type') assetType: AssetType,
    @Query('contentType') contentType: string,
  ) {
    if (!ASSET_TYPES.includes(assetType)) {
      throw new BadRequestException(
        `Invalid type. Must be one of: ${ASSET_TYPES.join(', ')}`,
      );
    }
    if (!contentType) {
      throw new BadRequestException('contentType is required');
    }
    if (!this.storageService.isAllowedMimeType(contentType, assetType)) {
      throw new BadRequestException(
        `Content type ${contentType} not allowed for ${assetType}`,
      );
    }
    // Extension derived server-side from contentType — client cannot influence it
    const ext = this.storageService.extFromContentType(contentType);
    return this.storageService.getPresignedUploadUrl(
      assetType,
      contentType,
      ext,
    );
  }

  @ApiOkResponse({ description: 'File deleted' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Delete('*key')
  delete(@Param('key') key: string) {
    return this.storageService.delete(key);
  }
}
