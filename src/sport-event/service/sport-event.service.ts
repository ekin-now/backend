import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SportEvent } from '../entities/sport-event.entity';
import { SportEventStatus } from '../entities/sport.event-status.enum';
import { CreateSportEventDto } from '../dto/create-sport-event.dto';
import { UpdateSportEventDto } from '../dto/update-sport-event.dto';
import { FindSportEventsDto } from '../dto/find-sport-events.dto';
import { FilterOptionsResponseDto } from '../dto/filter-options-response.dto';

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

  findAll(filters: FindSportEventsDto = {}): Promise<SportEvent[]> {
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.status NOT IN (:...statuses)', {
        statuses: [SportEventStatus.DRAFT, SportEventStatus.CANCELLED],
      });

    if (filters.sportType)
      qb.andWhere('e.sportType = :sportType', { sportType: filters.sportType });
    if (filters.country)
      qb.andWhere('e.country = :country', { country: filters.country });
    if (filters.region)
      qb.andWhere('e.region = :region', { region: filters.region });
    if (filters.dateFrom)
      qb.andWhere('e.eventDate >= :dateFrom', { dateFrom: filters.dateFrom });
    if (filters.dateTo)
      qb.andWhere('e.eventDate <= :dateTo', { dateTo: filters.dateTo });

    return qb.orderBy('e.eventDate', 'ASC').getMany();
  }

  async getFilterOptions(country?: string): Promise<FilterOptionsResponseDto> {
    const base = this.repo
      .createQueryBuilder('e')
      .where('e.status NOT IN (:...statuses)', {
        statuses: [SportEventStatus.DRAFT, SportEventStatus.CANCELLED],
      });

    const [sportTypesRaw, countriesRaw, regionsRaw] = await Promise.all([
      base
        .clone()
        .select('DISTINCT e.sportType', 'value')
        .getRawMany<{ value: string }>(),
      base
        .clone()
        .select('DISTINCT e.country', 'value')
        .getRawMany<{ value: string }>(),
      country
        ? base
            .clone()
            .andWhere('e.country = :country', { country })
            .select('DISTINCT e.region', 'value')
            .getRawMany<{ value: string }>()
        : Promise.resolve([]),
    ]);

    return {
      sportTypes: sportTypesRaw.map((r) => r.value).sort(),
      countries: countriesRaw.map((r) => r.value).sort(),
      regions: regionsRaw.map((r) => r.value).sort(),
    };
  }

  findOne(id: string): Promise<SportEvent | null> {
    return this.repo.findOneBy({ id });
  }

  findDetail(id: string): Promise<SportEvent | null> {
    return this.repo.findOne({
      where: { id },
      relations: { company: true, subEvents: true },
      order: { subEvents: { startDateTime: 'ASC' } },
    });
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
