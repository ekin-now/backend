import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../entities/registration.entity';
import { RegistrationStatus } from '../entities/registration-status.enum';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { UpdateRegistrationStatusDto } from '../dto/update-registration-status.dto';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { SportEventStatus } from '../../sport-event/entities/sport.event-status.enum';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly repo: Repository<Registration>,
    @InjectRepository(SportSubEvent)
    private readonly subEventRepo: Repository<SportSubEvent>,
  ) {}

  async create(
    participantId: string,
    dto: CreateRegistrationDto,
  ): Promise<Registration> {
    const subEvent = await this.subEventRepo.findOne({
      where: { id: dto.subEventId },
      relations: { sportEvent: true },
    });
    if (!subEvent) throw new NotFoundException('Sub-event not found');

    if (subEvent.sportEvent.status === SportEventStatus.CANCELLED) {
      throw new BadRequestException('Event is cancelled');
    }

    const existing = await this.repo.findOneBy({
      participantId,
      subEventId: dto.subEventId,
    });
    if (existing)
      throw new ConflictException('Already registered for this sub-event');

    const isFull =
      subEvent.capacity > 0 &&
      subEvent.registeredParticipants >= subEvent.capacity;

    const status = isFull
      ? RegistrationStatus.WAITLIST
      : RegistrationStatus.PENDING;

    const reg = this.repo.create({
      participantId,
      subEventId: dto.subEventId,
      sportEventId: subEvent.sportEventId,
      status,
      notes: dto.notes,
    });

    return this.repo.save(reg);
  }

  findAll(filters: {
    companyId?: string;
    sportEventId?: string;
    subEventId?: string;
    participantId?: string;
    status?: RegistrationStatus;
  }): Promise<Registration[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.participant', 'p')
      .leftJoinAndSelect('r.sportEvent', 'se')
      .leftJoinAndSelect('r.subEvent', 'sse')
      .orderBy('r.createdAt', 'DESC');

    if (filters.companyId) {
      qb.andWhere('se.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }
    if (filters.sportEventId) {
      qb.andWhere('r.sportEventId = :sportEventId', {
        sportEventId: filters.sportEventId,
      });
    }
    if (filters.subEventId) {
      qb.andWhere('r.subEventId = :subEventId', {
        subEventId: filters.subEventId,
      });
    }
    if (filters.participantId) {
      qb.andWhere('r.participantId = :participantId', {
        participantId: filters.participantId,
      });
    }
    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Registration> {
    const reg = await this.repo.findOne({
      where: { id },
      relations: { participant: true, sportEvent: true, subEvent: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    return reg;
  }

  async findAllByParticipant(participantId: string): Promise<Registration[]> {
    return this.repo.find({
      where: { participantId },
      relations: { sportEvent: true, subEvent: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateRegistrationStatusDto,
  ): Promise<Registration> {
    const reg = await this.findOne(id);
    const previousStatus = reg.status;
    reg.status = dto.status;
    if (dto.notes !== undefined) reg.notes = dto.notes;
    await this.repo.save(reg);

    // Sync registeredParticipants counter on the sub-event
    if (
      dto.status === RegistrationStatus.APPROVED &&
      previousStatus !== RegistrationStatus.APPROVED
    ) {
      await this.subEventRepo.increment(
        { id: reg.subEventId },
        'registeredParticipants',
        1,
      );
    } else if (
      previousStatus === RegistrationStatus.APPROVED &&
      dto.status !== RegistrationStatus.APPROVED
    ) {
      await this.subEventRepo.decrement(
        { id: reg.subEventId },
        'registeredParticipants',
        1,
      );
    }

    return this.findOne(id);
  }

  async cancel(id: string, participantId: string): Promise<Registration> {
    const reg = await this.findOne(id);
    if (reg.participantId !== participantId) {
      throw new BadRequestException('Not your registration');
    }
    if (reg.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Already cancelled');
    }

    const wasApproved = reg.status === RegistrationStatus.APPROVED;
    reg.status = RegistrationStatus.CANCELLED;
    await this.repo.save(reg);

    if (wasApproved) {
      await this.subEventRepo.decrement(
        { id: reg.subEventId },
        'registeredParticipants',
        1,
      );
    }

    return reg;
  }

  async remove(id: string): Promise<void> {
    const reg = await this.findOne(id);
    if (reg.status === RegistrationStatus.APPROVED) {
      await this.subEventRepo.decrement(
        { id: reg.subEventId },
        'registeredParticipants',
        1,
      );
    }
    await this.repo.remove(reg);
  }

  countByStatus(
    companyId?: string,
  ): Promise<{ status: string; count: string }[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status');

    if (companyId) {
      qb.innerJoin('r.sportEvent', 'se').andWhere('se.companyId = :companyId', {
        companyId,
      });
    }

    return qb.getRawMany<{ status: string; count: string }>();
  }
}
