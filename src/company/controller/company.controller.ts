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
import { StripeService } from '../../stripe/stripe.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';
import { ConfigService } from '@nestjs/config';

interface AuthUser {
  id: string;
  role: UserRole;
  companyId?: string;
}

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

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
    @Request() req: { user: AuthUser },
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

  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Stripe Connect onboarding URL',
    schema: { properties: { url: { type: 'string' } } },
  })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard)
  @Post(':id/stripe/onboard')
  async stripeOnboard(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyAdmin =
      req.user.role === UserRole.COMPANY_ADMIN && req.user.companyId === id;
    if (!isSuperAdmin && !isCompanyAdmin) throw new ForbiddenException();

    const company = await this.companyService.findOne(id);
    if (!company) throw new NotFoundException('Company not found');

    let stripeAccountId = company.stripeAccountId;
    if (!stripeAccountId) {
      const account = await this.stripeService.createConnectAccount(
        company.email ?? '',
      );
      stripeAccountId = account.id;
      await this.companyService.setStripeAccount(id, stripeAccountId);
    }

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    const link = await this.stripeService.createAccountLink(
      stripeAccountId,
      `${frontendUrl}/company/stripe/return`,
      `${frontendUrl}/company/stripe/refresh?companyId=${id}`,
    );

    return { url: link.url };
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Stripe Connect status',
    schema: {
      properties: {
        stripeAccountId: { type: 'string' },
        stripeOnboardingComplete: { type: 'boolean' },
      },
    },
  })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard)
  @Get(':id/stripe/status')
  async stripeStatus(
    @Param('id') id: string,
    @Request() req: { user: AuthUser },
  ) {
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyAdmin =
      req.user.role === UserRole.COMPANY_ADMIN && req.user.companyId === id;
    if (!isSuperAdmin && !isCompanyAdmin) throw new ForbiddenException();

    const company = await this.companyService.findOne(id);
    if (!company) throw new NotFoundException('Company not found');

    return {
      stripeAccountId: company.stripeAccountId ?? null,
      stripeOnboardingComplete: company.stripeOnboardingComplete,
    };
  }
}
