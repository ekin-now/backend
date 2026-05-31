import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SportEvent } from './entities/sport-event.entity';
import { SportEventService } from './service/sport-event.service';
import { SportEventController } from './controller/sport-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SportEvent])],
  providers: [SportEventService],
  controllers: [SportEventController],
  exports: [TypeOrmModule, SportEventService],
})
export class SportEventModule {}
