import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { PostComment } from '../entities/post-comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { PostType } from '../entities/post-type.enum';
import { CreatePostDto } from '../dto/create-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { PostFeedQueryDto } from '../dto/post-feed-query.dto';
import { UserRole } from '../../auth/decorators/userRole.enum';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostComment)
    private readonly commentRepo: Repository<PostComment>,
    @InjectRepository(PostLike)
    private readonly likeRepo: Repository<PostLike>,
  ) {}

  async create(dto: CreatePostDto, userId: string): Promise<Post> {
    const type = this.inferType(dto);
    const post = this.postRepo.create({ ...dto, type, userId });
    return this.postRepo.save(post);
  }

  async getFeed(userId: string, query: PostFeedQueryDto): Promise<Post[]> {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const { raw, entities } = await this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect([
        'u.id',
        'u.firstName',
        'u.lastName',
        'u.username',
        'u.avatarUrl',
      ])
      .leftJoin('p.sportEvent', 'e')
      .addSelect(['e.id', 'e.name', 'e.slug', 'e.sportType', 'e.bannerUrl'])
      .addSelect(
        '(SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = p.id)',
        'likesCount',
      )
      .addSelect(
        '(SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = p.id)',
        'commentsCount',
      )
      .where(
        'p.userId = :userId OR p.userId IN (SELECT f.following_id FROM follows f WHERE f.follower_id = :userId)',
        { userId },
      )
      .orderBy('p.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawAndEntities();

    const likedIds = await this.likeRepo
      .createQueryBuilder('l')
      .select('l.post_id', 'postId')
      .where('l.user_id = :userId', { userId })
      .getRawMany<{ postId: string }>();

    const likedSet = new Set(likedIds.map((l) => l.postId));

    return entities.map((p, i) =>
      Object.assign(p, {
        likesCount: raw[i]?.likesCount ?? 0,
        commentsCount: raw[i]?.commentsCount ?? 0,
        isLikedByMe: likedSet.has(p.id),
      }),
    );
  }

  async findOne(id: string, userId: string): Promise<Post> {
    const { raw, entities } = await this.postRepo
      .createQueryBuilder('p')
      .leftJoin('p.user', 'u')
      .addSelect([
        'u.id',
        'u.firstName',
        'u.lastName',
        'u.username',
        'u.avatarUrl',
      ])
      .leftJoin('p.sportEvent', 'e')
      .addSelect(['e.id', 'e.name', 'e.slug', 'e.sportType', 'e.bannerUrl'])
      .addSelect(
        '(SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = p.id)',
        'likesCount',
      )
      .addSelect(
        '(SELECT COUNT(*)::int FROM post_comments pc WHERE pc.post_id = p.id)',
        'commentsCount',
      )
      .where('p.id = :id', { id })
      .getRawAndEntities();

    const post = entities[0];
    if (!post) throw new NotFoundException('Post not found');

    const isLikedByMe = await this.likeRepo.existsBy({ userId, postId: id });
    return Object.assign(post, {
      likesCount: raw[0]?.likesCount ?? 0,
      commentsCount: raw[0]?.commentsCount ?? 0,
      isLikedByMe,
    });
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const post = await this.postRepo.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
    await this.postRepo.remove(post);
  }

  async like(postId: string, userId: string): Promise<void> {
    const exists = await this.likeRepo.existsBy({ userId, postId });
    if (exists) return;
    await this.likeRepo.save(this.likeRepo.create({ userId, postId }));
  }

  async unlike(postId: string, userId: string): Promise<void> {
    const like = await this.likeRepo.findOneBy({ userId, postId });
    if (!like) return;
    await this.likeRepo.remove(like);
  }

  async getComments(postId: string): Promise<PostComment[]> {
    return this.commentRepo.find({
      where: { postId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(
    postId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<PostComment> {
    const postExists = await this.postRepo.existsBy({ id: postId });
    if (!postExists) throw new NotFoundException('Post not found');
    const comment = this.commentRepo.create({ ...dto, postId, userId });
    const saved = await this.commentRepo.save(comment);
    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: { user: true },
    }) as Promise<PostComment>;
  }

  async removeComment(
    commentId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const comment = await this.commentRepo.findOneBy({ id: commentId });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
    await this.commentRepo.remove(comment);
  }

  private inferType(dto: CreatePostDto): PostType {
    if (dto.type) return dto.type;
    if (dto.activityData) return PostType.ACTIVITY;
    if (dto.sportEventId) return PostType.EVENT_REF;
    if (dto.imageUrl) return PostType.IMAGE;
    return PostType.TEXT;
  }
}
