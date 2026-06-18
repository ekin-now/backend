import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { ResultStatus } from './result-status.enum';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_id' })
  participant: User;

  @Column({ name: 'sport_event_id', type: 'uuid' })
  sportEventId: string;

  @ManyToOne(() => SportEvent)
  @JoinColumn({ name: 'sport_event_id' })
  sportEvent: SportEvent;

  @Column({ name: 'sub_event_id', type: 'uuid' })
  subEventId: string;

  @ManyToOne(() => SportSubEvent)
  @JoinColumn({ name: 'sub_event_id' })
  subEvent: SportSubEvent;

  @Column({ nullable: true })
  position: number;

  @Column({ nullable: true, name: 'finish_time_seconds' })
  finishTimeSeconds: number;

  @Column({ nullable: true, name: 'bib_number' })
  bibNumber: number;

  @Column({ type: 'enum', enum: ResultStatus, default: ResultStatus.FINISHED })
  status: ResultStatus;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, name: 'category_position' })
  categoryPosition: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
