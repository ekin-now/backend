import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportSubEvent } from './entities/sport-sub-event.entity';
import { SportEventModule } from '../sport-event/sport-event.module';
import { SportSubEventService } from './service/sport-sub-event.service';
import { SportSubEventController } from './controller/sport-sub-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SportSubEvent]), SportEventModule],
  providers: [SportSubEventService],
  controllers: [SportSubEventController],
})
export class SportSubEventModule {}
