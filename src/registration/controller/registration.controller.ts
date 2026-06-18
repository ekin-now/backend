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
  Request,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { RegistrationService } from '../service/registration.service';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { UpdateRegistrationStatusDto } from '../dto/update-registration-status.dto';
import { RegistrationResponseDto } from '../dto/registration-response.dto';
import { RegistrationStatus } from '../entities/registration-status.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

@ApiTags('registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @ApiCreatedResponse({ type: RegistrationResponseDto })
  @ApiConflictResponse({ description: 'Already registered' })
  @ApiUnauthorizedResponse()
  @Post()
  create(
    @Body() dto: CreateRegistrationDto,
    @Request() req: { user: AuthUser },
  ) {
    return this.registrationService.create(req.user.id, dto);
  }

  @ApiOkResponse({ type: [RegistrationResponseDto] })
  @ApiQuery({ name: 'sportEventId', required: false })
  @ApiQuery({ name: 'subEventId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_STAFF)
  @Get()
  findAll(
    @Request() req: { user: AuthUser },
    @Query('sportEventId') sportEventId?: string,
    @Query('subEventId') subEventId?: string,
    @Query('status') status?: RegistrationStatus,
  ) {
    const companyId =
      req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.companyId;
    return this.registrationService.findAll({
      companyId,
      sportEventId,
      subEventId,
      status,
    });
  }

  @ApiOkResponse({ type: [RegistrationResponseDto] })
  @Get('me')
  findMine(@Request() req: { user: AuthUser }) {
    return this.registrationService.findAllByParticipant(req.user.id);
  }

  @ApiOkResponse({ type: RegistrationResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthUser },
  ) {
    const reg = await this.registrationService.findOne(id);
    const isOwner = reg.participantId === req.user.id;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyMatch =
      (req.user.role === UserRole.COMPANY_ADMIN ||
        req.user.role === UserRole.COMPANY_STAFF) &&
      reg.sportEvent?.companyId === req.user.companyId;

    if (!isOwner && !isSuperAdmin && !isCompanyMatch)
      throw new ForbiddenException();
    return reg;
  }

  @ApiOkResponse({ type: RegistrationResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegistrationStatusDto,
    @Request() req: { user: AuthUser },
  ) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      const reg = await this.registrationService.findOne(id);
      if (reg.sportEvent?.companyId !== req.user.companyId) {
        throw new ForbiddenException();
      }
    }
    return this.registrationService.updateStatus(id, dto);
  }

  @ApiOkResponse({ type: RegistrationResponseDto })
  @ApiNotFoundResponse()
  @Delete(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthUser },
  ) {
    return this.registrationService.cancel(id, req.user.id);
  }

  @ApiOkResponse()
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationService.remove(id);
  }
}
