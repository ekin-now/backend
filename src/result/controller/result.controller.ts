import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ResultService } from '../service/result.service';
import { CreateResultDto } from '../dto/create-result.dto';
import { BulkCreateResultDto } from '../dto/bulk-create-result.dto';
import { UpdateResultDto } from '../dto/update-result.dto';
import { ResultResponseDto } from '../dto/result-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

@ApiTags('results')
@Controller('results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ResultResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  create(@Body() dto: CreateResultDto) {
    return this.resultService.create(dto);
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: [ResultResponseDto] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateResultDto) {
    return this.resultService.bulkCreate(dto);
  }

  @ApiOkResponse({ type: [ResultResponseDto] })
  @ApiQuery({ name: 'sportEventId', required: false })
  @ApiQuery({ name: 'subEventId', required: false })
  @ApiQuery({ name: 'participantId', required: false })
  @Get()
  findAll(
    @Query('sportEventId') sportEventId?: string,
    @Query('subEventId') subEventId?: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.resultService.findAll({
      sportEventId,
      subEventId,
      participantId,
    });
  }

  @ApiOkResponse({ type: ResultResponseDto })
  @ApiNotFoundResponse()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.resultService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: ResultResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateResultDto) {
    return this.resultService.update(id, dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse()
  @ApiNotFoundResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.resultService.remove(id);
  }
}
