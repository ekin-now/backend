import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { SportSubEventStatus } from './sport-sub-evet-status.enum';

@Entity('sport_sub_events')
export class SportSubEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sport_event_id' })
  sportEventId: string;

  @ManyToOne(() => SportEvent, (event) => event.subEvents)
  @JoinColumn({ name: 'sport_event_id' })
  sportEvent: SportEvent;

  @Column()
  name: string;

  @Column({ length: 500 })
  shortDescription: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SportSubEventStatus,
    default: SportSubEventStatus.DRAFT,
  })
  status: SportSubEventStatus;

  /**
   * Distancia en kilómetros
   * Ej: 10, 21.097, 42.195
   */
  @Column('decimal', {
    precision: 8,
    scale: 3,
    nullable: true,
  })
  distanceKm: number;

  /**
   * Desnivel positivo acumulado
   */
  @Column({
    nullable: true,
  })
  elevationGainMeters: number;

  /**
   * Plazas máximas
   */
  @Column({
    default: 0,
  })
  capacity: number;

  /**
   * Inscritos actuales
   */
  @Column({
    default: 0,
  })
  registeredParticipants: number;

  /**
   * Precio inscripción
   */
  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({
    default: 'EUR',
  })
  currency: string;

  /**
   * Fecha y hora de salida
   */
  @Column()
  startDateTime: Date;

  /**
   * Tiempo límite para completar la prueba
   */
  @Column({
    nullable: true,
  })
  timeLimitMinutes: number;

  /**
   * Edad mínima
   */
  @Column({
    nullable: true,
  })
  minimumAge: number;

  /**
   * Edad máxima
   */
  @Column({
    nullable: true,
  })
  maximumAge: number;

  /**
   * URL GPX principal
   */
  @Column({
    nullable: true,
  })
  gpxUrl: string;

  /**
   * Imagen de portada específica
   */
  @Column({
    nullable: true,
  })
  coverImageUrl: string;

  /**
   * Control de dorsal
   */
  @Column({
    default: false,
  })
  bibNumberRequired: boolean;

  /**
   * Número inicial de dorsales
   */
  @Column({
    nullable: true,
  })
  bibStartNumber: number;

  /**
   * Número final de dorsales
   */
  @Column({
    nullable: true,
  })
  bibEndNumber: number;

  /**
   * Apertura de inscripciones
   */
  @Column({
    nullable: true,
  })
  registrationOpenAt: Date;

  /**
   * Cierre de inscripciones
   */
  @Column({
    nullable: true,
  })
  registrationCloseAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
