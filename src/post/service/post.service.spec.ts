import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';
import { Post } from '../entities/post.entity';
import { PostComment } from '../entities/post-comment.entity';
import { PostLike } from '../entities/post-like.entity';
import { PostType } from '../entities/post-type.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';

const mockPost: Partial<Post> = {
  id: 'post-1',
  text: 'Test post',
  type: PostType.TEXT,
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockComment: Partial<PostComment> = {
  id: 'comment-1',
  text: 'Nice!',
  postId: 'post-1',
  userId: 'user-1',
  createdAt: new Date(),
};

const mockQb: any = {
  leftJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  loadRelationCountAndMap: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getOne: jest.fn(),
};

const mockPostRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  existsBy: jest.fn(),
  remove: jest.fn(),
};

const mockCommentRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockLikeRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQb),
  existsBy: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPostRepo.createQueryBuilder.mockReturnValue(mockQb);
    mockLikeRepo.createQueryBuilder.mockReturnValue(mockQb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepo },
        { provide: getRepositoryToken(PostComment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(PostLike), useValue: mockLikeRepo },
      ],
    }).compile();
    service = module.get(PostService);
  });

  describe('create', () => {
    it('infers TEXT type when no image/activity/event', async () => {
      mockPostRepo.create.mockReturnValue(mockPost);
      mockPostRepo.save.mockResolvedValue(mockPost);

      await service.create({ text: 'Hello' }, 'user-1');

      expect(mockPostRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: PostType.TEXT }),
      );
    });

    it('infers IMAGE type when imageUrl provided', async () => {
      mockPostRepo.create.mockReturnValue(mockPost);
      mockPostRepo.save.mockResolvedValue(mockPost);

      await service.create(
        { text: 'Hello', imageUrl: 'https://img.jpg' },
        'user-1',
      );

      expect(mockPostRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: PostType.IMAGE }),
      );
    });

    it('infers ACTIVITY type when activityData provided', async () => {
      mockPostRepo.create.mockReturnValue(mockPost);
      mockPostRepo.save.mockResolvedValue(mockPost);

      await service.create(
        { text: 'Run', activityData: { sport: 'running', distance: 10 } },
        'user-1',
      );

      expect(mockPostRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: PostType.ACTIVITY }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when post not found', async () => {
      mockPostRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.remove('x', 'u', UserRole.PARTICIPANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when not owner and not SUPER_ADMIN', async () => {
      mockPostRepo.findOneBy.mockResolvedValue({
        ...mockPost,
        userId: 'other',
      });
      await expect(
        service.remove('post-1', 'user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows SUPER_ADMIN to delete any post', async () => {
      mockPostRepo.findOneBy.mockResolvedValue({
        ...mockPost,
        userId: 'other',
      });
      mockPostRepo.remove.mockResolvedValue({});
      await expect(
        service.remove('post-1', 'user-1', UserRole.SUPER_ADMIN),
      ).resolves.not.toThrow();
    });
  });

  describe('like / unlike', () => {
    it('like is idempotent when already liked', async () => {
      mockLikeRepo.existsBy.mockResolvedValue(true);
      await service.like('post-1', 'user-1');
      expect(mockLikeRepo.save).not.toHaveBeenCalled();
    });

    it('unlike is idempotent when not liked', async () => {
      mockLikeRepo.findOneBy.mockResolvedValue(null);
      await service.unlike('post-1', 'user-1');
      expect(mockLikeRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('getComments', () => {
    it('returns comments ordered by date', async () => {
      mockCommentRepo.find.mockResolvedValue([mockComment]);
      const result = await service.getComments('post-1');
      expect(mockCommentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'post-1' } }),
      );
      expect(result).toEqual([mockComment]);
    });
  });

  describe('addComment', () => {
    it('throws NotFoundException when post not found', async () => {
      mockPostRepo.existsBy.mockResolvedValue(false);
      await expect(
        service.addComment('x', 'u', { text: 'hi' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates and returns comment with user relation', async () => {
      mockPostRepo.existsBy.mockResolvedValue(true);
      mockCommentRepo.create.mockReturnValue(mockComment);
      mockCommentRepo.save.mockResolvedValue(mockComment);
      mockCommentRepo.findOne.mockResolvedValue(mockComment);

      const result = await service.addComment('post-1', 'user-1', {
        text: 'Nice!',
      });

      expect(result).toEqual(mockComment);
    });
  });

  describe('removeComment', () => {
    it('throws NotFoundException when comment not found', async () => {
      mockCommentRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.removeComment('x', 'u', UserRole.PARTICIPANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when not owner and not SUPER_ADMIN', async () => {
      mockCommentRepo.findOneBy.mockResolvedValue({
        ...mockComment,
        userId: 'other',
      });
      await expect(
        service.removeComment('c-1', 'user-1', UserRole.PARTICIPANT),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
