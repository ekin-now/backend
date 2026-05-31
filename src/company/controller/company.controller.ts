import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  UseGuards,
  Request,
  ForbiddenException,
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
import { CompanyService } from '../service/company.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CompanyResponseDto })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiNotFoundResponse({ description: 'Company not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const company = await this.companyService.findOne(id);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiNotFoundResponse({ description: 'Company not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @Request()
    req: { user: { id: string; role: UserRole; companyId?: string } },
  ) {
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyAdmin =
      req.user.role === UserRole.COMPANY_ADMIN && req.user.companyId === id;
    if (!isSuperAdmin && !isCompanyAdmin) throw new ForbiddenException();
    return this.companyService.update(id, dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Company deactivated' })
  @ApiNotFoundResponse({ description: 'Company not found' })
  @ApiForbiddenResponse()
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
