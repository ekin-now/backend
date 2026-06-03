import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SportEvent } from '../../sport-event/entities/sport-event.entity';
import { PostComment } from './post-comment.entity';
import { PostLike } from './post-like.entity';
import { PostType } from './post-type.enum';

export interface ActivityData {
  sport: string;
  distance?: number;
  duration?: number;
  pace?: string;
  elevation?: number;
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'enum', enum: PostType, default: PostType.TEXT })
  type: PostType;

  @Column({ type: 'jsonb', nullable: true })
  activityData?: ActivityData;

  @Column({ name: 'sport_event_id', nullable: true, type: 'uuid' })
  sportEventId?: string;

  @ManyToOne(() => SportEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sport_event_id' })
  sportEvent?: SportEvent;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PostComment, (c) => c.post)
  comments: PostComment[];

  @OneToMany(() => PostLike, (l) => l.post)
  likes: PostLike[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
