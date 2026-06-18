import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { PaymentService } from '../service/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { CheckoutResponseDto } from '../dto/checkout-response.dto';
import { UpdatePaymentStatusDto } from '../dto/update-payment-status.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentStatus } from '../entities/payment-status.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/decorators/userRole.enum';

interface AuthUser {
  id: string;
  role: UserRole;
  companyId?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CheckoutResponseDto })
  @ApiUnauthorizedResponse()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @Request() req: { user: AuthUser },
  ) {
    return this.paymentService.createCheckout(dto, req.user.id);
  }

  @ApiExcludeEndpoint()
  @Post('webhook')
  async stripeWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new BadRequestException('Missing raw body');
    await this.paymentService.handleStripeWebhook(rawBody, signature);
    return { received: true };
  }

  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PaymentResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Post()
  async create(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user: AuthUser },
  ) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      const reg = await this.paymentService.findRegistrationWithEvent(
        dto.registrationId,
      );
      if (reg.sportEvent?.companyId !== req.user.companyId)
        throw new ForbiddenException();
    }
    return this.paymentService.create(dto);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: [PaymentResponseDto] })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_STAFF)
  @Get()
  findAll(
    @Request() req: { user: AuthUser },
    @Query('status') status?: PaymentStatus,
  ) {
    const companyId =
      req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.companyId;
    return this.paymentService.findAll({ companyId, status });
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: [PaymentResponseDto] })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@Request() req: { user: AuthUser }) {
    return this.paymentService.findAll({ participantId: req.user.id });
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthUser },
  ) {
    const payment = await this.paymentService.findOne(id);
    const isOwner = payment.participantId === req.user.id;
    const isSuperAdmin = req.user.role === UserRole.SUPER_ADMIN;
    const isCompanyMatch =
      (req.user.role === UserRole.COMPANY_ADMIN ||
        req.user.role === UserRole.COMPANY_STAFF) &&
      payment.registration?.sportEvent?.companyId === req.user.companyId;

    if (!isOwner && !isSuperAdmin && !isCompanyMatch)
      throw new ForbiddenException();
    return payment;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse()
  @ApiForbiddenResponse()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @Request() req: { user: AuthUser },
  ) {
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      const payment = await this.paymentService.findOne(id);
      if (payment.registration?.sportEvent?.companyId !== req.user.companyId) {
        throw new ForbiddenException();
      }
    }
    return this.paymentService.updateStatus(id, dto);
  }
}
