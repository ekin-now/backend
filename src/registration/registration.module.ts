import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './entities/registration.entity';
import { SportSubEvent } from '../sport-sub-event/entities/sport-sub-event.entity';
import { RegistrationService } from './service/registration.service';
import { RegistrationController } from './controller/registration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, SportSubEvent])],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
