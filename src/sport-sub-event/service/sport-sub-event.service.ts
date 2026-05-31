import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SportSubEvent } from '../entities/sport-sub-event.entity';
import { SportSubEventStatus } from '../entities/sport-sub-evet-status.enum';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { CreateSportSubEventDto } from '../dto/create-sport-sub-event.dto';
import { UpdateSportSubEventDto } from '../dto/update-sport-sub-event.dto';

@Injectable()
export class SportSubEventService {
  constructor(
    @InjectRepository(SportSubEvent)
    private readonly repo: Repository<SportSubEvent>,
    @InjectRepository(SportEvent)
    private readonly sportEventRepo: Repository<SportEvent>,
  ) {}

  async create(
    eventId: string,
    dto: CreateSportSubEventDto,
  ): Promise<SportSubEvent> {
    const event = await this.sportEventRepo.findOneBy({ id: eventId });
    if (!event) throw new NotFoundException('Sport event not found');

    const subEvent = this.repo.create({ ...dto, sportEventId: eventId });
    return this.repo.save(subEvent);
  }

  findByEvent(eventId: string): Promise<SportSubEvent[]> {
    return this.repo.findBy({
      sportEventId: eventId,
      status: Not(
        In([SportSubEventStatus.DRAFT, SportSubEventStatus.CANCELLED]),
      ),
    });
  }

  findOne(eventId: string, id: string): Promise<SportSubEvent | null> {
    return this.repo.findOneBy({ id, sportEventId: eventId });
  }

  async update(
    id: string,
    dto: UpdateSportSubEventDto,
  ): Promise<SportSubEvent> {
    const subEvent = await this.repo.findOneBy({ id });
    if (!subEvent) throw new NotFoundException('Sport sub-event not found');

    Object.assign(subEvent, dto);
    return this.repo.save(subEvent);
  }

  async remove(id: string): Promise<void> {
    const subEvent = await this.repo.findOneBy({ id });
    if (!subEvent) throw new NotFoundException('Sport sub-event not found');
    subEvent.status = SportSubEventStatus.CANCELLED;
    await this.repo.save(subEvent);
  }
}
