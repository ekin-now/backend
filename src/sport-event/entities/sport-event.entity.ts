import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { SportSubEvent } from '../../sport-sub-event/entities/sport-sub-event.entity';
import { SportEventStatus } from './sport.event-status.enum';

@Entity('sport_events')
export class SportEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ length: 500 })
  shortDescription: string;

  @Column('text')
  description: string;

  @Column()
  sportType: string;

  @Column({
    type: 'enum',
    enum: SportEventStatus,
    default: SportEventStatus.DRAFT,
  })
  status: SportEventStatus;

  @Column()
  eventDate: Date;

  @Column({ nullable: true })
  registrationOpenAt: Date;

  @Column({ nullable: true })
  registrationCloseAt: Date;

  @Column()
  country: string;

  @Column()
  region: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', {
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number;

  @Column('decimal', {
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ nullable: true })
  rulesDocumentUrl: string;

  @Column({ default: false })
  featured: boolean;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  companyId: string;

  @OneToMany(() => SportSubEvent, (sub) => sub.sportEvent)
  subEvents: SportSubEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
