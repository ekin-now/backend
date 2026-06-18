import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    unique: true,
  })
  slug: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  description?: string;

  @Column({
    nullable: true,
  })
  website?: string;

  @Column({
    nullable: true,
  })
  email?: string;

  @Column({
    nullable: true,
  })
  phone?: string;

  @Column({
    nullable: true,
  })
  logoUrl?: string;

  @Column({
    nullable: true,
  })
  bannerUrl?: string;

  @Column({
    nullable: true,
  })
  country?: string;

  @Column({
    nullable: true,
  })
  city?: string;

  @Column({
    nullable: true,
  })
  address?: string;

  @Column({
    nullable: true,
  })
  sportType?: string;

  @Column({
    nullable: true,
  })
  companyType?: string;

  @Column({ nullable: true, name: 'stripe_account_id' })
  stripeAccountId?: string;

  @Column({ default: false, name: 'stripe_onboarding_complete' })
  stripeOnboardingComplete: boolean;

  @Column({
    default: true,
  })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
