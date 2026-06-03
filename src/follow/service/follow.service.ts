import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly repo: Repository<Follow>,
  ) {}

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const exists = await this.repo.existsBy({ followerId, followingId });
    if (exists) throw new ConflictException('Already following');
    await this.repo.save(this.repo.create({ followerId, followingId }));
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follow = await this.repo.findOneBy({ followerId, followingId });
    if (!follow) throw new NotFoundException('Not following this user');
    await this.repo.remove(follow);
  }

  getFollowers(userId: string): Promise<Follow[]> {
    return this.repo.find({
      where: { followingId: userId },
      relations: { follower: true },
      order: { createdAt: 'DESC' },
    });
  }

  getFollowing(userId: string): Promise<Follow[]> {
    return this.repo.find({
      where: { followerId: userId },
      relations: { following: true },
      order: { createdAt: 'DESC' },
    });
  }

  isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.repo.existsBy({ followerId, followingId });
  }
}
