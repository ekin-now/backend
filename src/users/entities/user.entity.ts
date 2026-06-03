import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from '../../auth/decorators/userRole.enum';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    unique: true,
    nullable: true,
  })
  username?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    nullable: true,
  })
  phone?: string;

  @Column({
    nullable: true,
  })
  avatarUrl?: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  birthDate?: Date;

  @Column({
    default: true,
  })
  isActive: boolean;

  @Column({
    default: false,
  })
  isVerified: boolean;

  @Column({
    nullable: true,
  })
  gender?: string;

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
  bio?: string;

  @Column({
    nullable: true,
  })
  instagram?: string;

  @Column({
    nullable: true,
  })
  strava?: string;

  @Column({ nullable: true, type: 'uuid' })
  companyId?: string;

  @ManyToOne(() => Company, (company) => company.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  company?: Company;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PARTICIPANT,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
