import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from '../entities/result.entity';
import { CreateResultDto } from '../dto/create-result.dto';
import { UpdateResultDto } from '../dto/update-result.dto';
import { BulkCreateResultDto } from '../dto/bulk-create-result.dto';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(Result)
    private readonly repo: Repository<Result>,
  ) {}

  create(dto: CreateResultDto): Promise<Result> {
    return this.repo.save(this.repo.create(dto));
  }

  async bulkCreate(dto: BulkCreateResultDto): Promise<Result[]> {
    const entities = dto.results.map((r) => this.repo.create(r));
    return this.repo.save(entities);
  }

  findAll(filters: {
    sportEventId?: string;
    subEventId?: string;
    participantId?: string;
  }): Promise<Result[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.participant', 'u')
      .leftJoinAndSelect('r.subEvent', 'sse')
      .orderBy('r.position', 'ASC')
      .addOrderBy('r.finishTimeSeconds', 'ASC');

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

    return qb.getMany();
  }

  async findOne(id: string): Promise<Result> {
    const result = await this.repo.findOne({
      where: { id },
      relations: { participant: true, subEvent: true, sportEvent: true },
    });
    if (!result) throw new NotFoundException('Result not found');
    return result;
  }

  async update(id: string, dto: UpdateResultDto): Promise<Result> {
    const result = await this.findOne(id);
    Object.assign(result, dto);
    return this.repo.save(result);
  }

  async remove(id: string): Promise<void> {
    const result = await this.findOne(id);
    await this.repo.remove(result);
  }
}
