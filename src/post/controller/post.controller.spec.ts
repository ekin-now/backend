import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from '../service/post.service';
import { PostType } from '../entities/post-type.enum';
import { UserRole } from '../../auth/decorators/userRole.enum';

const mockService = {
  getFeed: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  like: jest.fn(),
  unlike: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  removeComment: jest.fn(),
};

const req = { user: { id: 'user-1', role: UserRole.PARTICIPANT } };

const mockPost = {
  id: 'post-1',
  text: 'Hello',
  type: PostType.TEXT,
  userId: 'user-1',
  likesCount: 0,
  commentsCount: 0,
  isLikedByMe: false,
};

describe('PostController', () => {
  let controller: PostController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: mockService }],
    }).compile();
    controller = module.get(PostController);
  });

  it('getFeed delegates to service', async () => {
    mockService.getFeed.mockResolvedValue([mockPost]);
    const result = await controller.getFeed(req, { page: 1, limit: 20 });
    expect(mockService.getFeed).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 20,
    });
    expect(result).toEqual([mockPost]);
  });

  it('create delegates to service', async () => {
    mockService.create.mockResolvedValue(mockPost);
    const result = await controller.create(req, { text: 'Hello' });
    expect(mockService.create).toHaveBeenCalledWith(
      { text: 'Hello' },
      'user-1',
    );
    expect(result).toEqual(mockPost);
  });

  it('findOne delegates to service', async () => {
    mockService.findOne.mockResolvedValue(mockPost);
    const result = await controller.findOne(req, 'post-1');
    expect(mockService.findOne).toHaveBeenCalledWith('post-1', 'user-1');
    expect(result).toEqual(mockPost);
  });

  it('remove delegates to service with role', async () => {
    mockService.remove.mockResolvedValue(undefined);
    await controller.remove(req, 'post-1');
    expect(mockService.remove).toHaveBeenCalledWith(
      'post-1',
      'user-1',
      UserRole.PARTICIPANT,
    );
  });

  it('like delegates to service', async () => {
    mockService.like.mockResolvedValue(undefined);
    await controller.like(req, 'post-1');
    expect(mockService.like).toHaveBeenCalledWith('post-1', 'user-1');
  });

  it('unlike delegates to service', async () => {
    mockService.unlike.mockResolvedValue(undefined);
    await controller.unlike(req, 'post-1');
    expect(mockService.unlike).toHaveBeenCalledWith('post-1', 'user-1');
  });

  it('getComments delegates to service', async () => {
    mockService.getComments.mockResolvedValue([]);
    const result = await controller.getComments('post-1');
    expect(mockService.getComments).toHaveBeenCalledWith('post-1');
    expect(result).toEqual([]);
  });

  it('addComment delegates to service', async () => {
    const comment = { id: 'c-1', text: 'Nice!' };
    mockService.addComment.mockResolvedValue(comment);
    const result = await controller.addComment(req, 'post-1', {
      text: 'Nice!',
    });
    expect(mockService.addComment).toHaveBeenCalledWith('post-1', 'user-1', {
      text: 'Nice!',
    });
    expect(result).toEqual(comment);
  });

  it('removeComment delegates to service with role', async () => {
    mockService.removeComment.mockResolvedValue(undefined);
    await controller.removeComment(req, 'comment-1');
    expect(mockService.removeComment).toHaveBeenCalledWith(
      'comment-1',
      'user-1',
      UserRole.PARTICIPANT,
    );
  });
});
