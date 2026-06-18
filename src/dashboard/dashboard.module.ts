import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportEvent } from '../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../sport-sub-event/entities/sport-sub-event.entity';
import { Registration } from '../registration/entities/registration.entity';
import { Payment } from '../payment/entities/payment.entity';
import { DashboardService } from './service/dashboard.service';
import { DashboardController } from './controller/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SportEvent,
      SportSubEvent,
      Registration,
      Payment,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
