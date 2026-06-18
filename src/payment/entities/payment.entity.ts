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
import { Registration } from '../../registration/entities/registration.entity';
import { PaymentStatus } from './payment-status.enum';
import { PaymentMethod } from './payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'registration_id', type: 'uuid' })
  registrationId: string;

  @ManyToOne(() => Registration)
  @JoinColumn({ name: 'registration_id' })
  registration: Registration;

  @Column({ name: 'participant_id', type: 'uuid' })
  participantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_id' })
  participant: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true, name: 'stripe_payment_intent_id' })
  stripePaymentIntentId: string;

  @Column({ nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
