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
import { RegistrationStatus } from './registration-status.enum';

@Entity('registrations')
export class Registration {
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

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
