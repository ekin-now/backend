import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Registration } from '../registration/entities/registration.entity';
import { Company } from '../company/entities/company.entity';
import { PaymentService } from './service/payment.service';
import { PaymentController } from './controller/payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Registration, Company])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
