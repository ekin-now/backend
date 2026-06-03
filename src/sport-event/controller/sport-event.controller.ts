import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SportEventService } from '../service/sport-event.service';
import { CreateSportEventDto } from '../dto/create-sport-event.dto';
import { UpdateSportEventDto } from '../dto/update-sport-event.dto';
import { FindSportEventsDto } from '../dto/find-sport-events.dto';
import { FilterOptionsResponseDto } from '../dto/filter-options-response.dto';
import { SportEventResponseDto } from '../dto/sport-event-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

@ApiTags('sport-events')
@Controller('sport-events')
export class SportEventController {
  constructor(private readonly sportEventService: SportEventService) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: SportEventResponseDto })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  create(
    @Body() dto: CreateSportEventDto,
    @Request() req: { user: { role: UserRole; companyId?: string } },
  ) {
    const companyId =
      req.user.role === UserRole.COMPANY_ADMIN
        ? req.user.companyId
        : dto.companyId;
    if (!companyId) throw new BadRequestException('companyId is required');
    return this.sportEventService.create({ ...dto, companyId });
  }

  @ApiOkResponse({ type: SportEventResponseDto, isArray: true })
  @Get()
  findAll(@Query() query: FindSportEventsDto) {
    return this.sportEventService.findAll(query);
  }

  @ApiOkResponse({ type: FilterOptionsResponseDto })
  @Get('filter-options')
  getFilterOptions(@Query('country') country?: string) {
    return this.sportEventService.getFilterOptions(country);
  }

  @ApiOkResponse({ type: SportEventResponseDto })
  @ApiNotFoundResponse({ description: 'Sport event not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.sportEventService.findOne(id);
    if (!event) throw new NotFoundException('Sport event not found');
    return event;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: SportEventResponseDto })
  @ApiNotFoundResponse({ description: 'Sport event not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSportEventDto,
    @Request() req: { user: { role: UserRole; companyId?: string } },
  ) {
    const event = await this.sportEventService.findOne(id);
    if (!event) throw new NotFoundException('Sport event not found');

    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyAdmin =
      req.user.role === UserRole.COMPANY_ADMIN &&
      req.user.companyId === event.companyId;
    if (!isSuperAdmin && !isCompanyAdmin) throw new ForbiddenException();

    return this.sportEventService.update(id, dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Sport event cancelled' })
  @ApiNotFoundResponse({ description: 'Sport event not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sportEventService.remove(id);
  }
}
