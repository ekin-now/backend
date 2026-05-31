import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  ForbiddenException,
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SportSubEventService } from '../service/sport-sub-event.service';
import { SportEventService } from '../../sport-event/service/sport-event.service';
import { CreateSportSubEventDto } from '../dto/create-sport-sub-event.dto';
import { UpdateSportSubEventDto } from '../dto/update-sport-sub-event.dto';
import { SportSubEventResponseDto } from '../dto/sport-sub-event-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

@ApiTags('sport-events')
@Controller('sport-events/:eventId/sub-events')
export class SportSubEventController {
  constructor(
    private readonly sportSubEventService: SportSubEventService,
    private readonly sportEventService: SportEventService,
  ) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: SportSubEventResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateSportSubEventDto,
    @Request() req: { user: { role: UserRole; companyId?: string } },
  ) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      const event = await this.sportEventService.findOne(eventId);
      if (!event) throw new NotFoundException('Sport event not found');
      if (event.companyId !== req.user.companyId)
        throw new ForbiddenException();
    }
    return this.sportSubEventService.create(eventId, dto);
  }

  @ApiOkResponse({ type: SportSubEventResponseDto, isArray: true })
  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.sportSubEventService.findByEvent(eventId);
  }

  @ApiOkResponse({ type: SportSubEventResponseDto })
  @ApiNotFoundResponse({ description: 'Sport sub-event not found' })
  @Get(':id')
  async findOne(@Param('eventId') eventId: string, @Param('id') id: string) {
    const subEvent = await this.sportSubEventService.findOne(eventId, id);
    if (!subEvent) throw new NotFoundException('Sport sub-event not found');
    return subEvent;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: SportSubEventResponseDto })
  @ApiNotFoundResponse({ description: 'Sport sub-event not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id')
  async update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSportSubEventDto,
    @Request() req: { user: { role: UserRole; companyId?: string } },
  ) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      const event = await this.sportEventService.findOne(eventId);
      if (!event) throw new NotFoundException('Sport event not found');
      if (event.companyId !== req.user.companyId)
        throw new ForbiddenException();
    }
    return this.sportSubEventService.update(id, dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Sport sub-event cancelled' })
  @ApiNotFoundResponse({ description: 'Sport sub-event not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sportSubEventService.remove(id);
  }
}
