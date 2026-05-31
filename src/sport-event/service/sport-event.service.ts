import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SportEvent } from '../entities/sport-event.entity';
import { SportEventStatus } from '../entities/sport.event-status.enum';
import { CreateSportEventDto } from '../dto/create-sport-event.dto';
import { UpdateSportEventDto } from '../dto/update-sport-event.dto';

@Injectable()
export class SportEventService {
  constructor(
    @InjectRepository(SportEvent)
    private readonly repo: Repository<SportEvent>,
  ) {}

  async create(
    dto: CreateSportEventDto & { companyId: string },
  ): Promise<SportEvent> {
    const slug = dto.slug ?? this.generateSlug(dto.name);

    const exists = await this.repo.findOneBy({ slug });
    if (exists) throw new ConflictException('Slug already in use');

    const event = this.repo.create({ ...dto, slug });
    return this.repo.save(event);
  }

  findAll(): Promise<SportEvent[]> {
    return this.repo.findBy({
      status: Not(In([SportEventStatus.DRAFT, SportEventStatus.CANCELLED])),
    });
  }

  findOne(id: string): Promise<SportEvent | null> {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, dto: UpdateSportEventDto): Promise<SportEvent> {
    const event = await this.repo.findOneBy({ id });
    if (!event) throw new NotFoundException('Sport event not found');

    Object.assign(event, dto);
    return this.repo.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.repo.findOneBy({ id });
    if (!event) throw new NotFoundException('Sport event not found');
    event.status = SportEventStatus.CANCELLED;
    await this.repo.save(event);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}
