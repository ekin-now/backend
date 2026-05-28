import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
/*
  @OneToMany(() => OrganizationMember, (member) => member.user)
  memberships: OrganizationMember[];
*/
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
