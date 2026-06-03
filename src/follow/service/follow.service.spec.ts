import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { Follow } from '../entities/follow.entity';

const mockRepository = {
  existsBy: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('FollowService', () => {
  let service: FollowService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        { provide: getRepositoryToken(Follow), useValue: mockRepository },
      ],
    }).compile();
    service = module.get(FollowService);
  });

  describe('follow', () => {
    it('throws BadRequestException when following self', async () => {
      await expect(service.follow('uid', 'uid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when already following', async () => {
      mockRepository.existsBy.mockResolvedValue(true);
      await expect(service.follow('a', 'b')).rejects.toThrow(ConflictException);
    });

    it('creates follow relationship', async () => {
      mockRepository.existsBy.mockResolvedValue(false);
      mockRepository.create.mockReturnValue({
        followerId: 'a',
        followingId: 'b',
      });
      mockRepository.save.mockResolvedValue({});

      await service.follow('a', 'b');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('throws NotFoundException when not following', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.unfollow('a', 'b')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('removes follow relationship', async () => {
      const follow = { followerId: 'a', followingId: 'b' };
      mockRepository.findOneBy.mockResolvedValue(follow);
      mockRepository.remove.mockResolvedValue({});

      await service.unfollow('a', 'b');

      expect(mockRepository.remove).toHaveBeenCalledWith(follow);
    });
  });

  describe('getFollowers', () => {
    it('returns followers for user', async () => {
      const followers = [{ followerId: 'x', followingId: 'uid' }];
      mockRepository.find.mockResolvedValue(followers);

      const result = await service.getFollowers('uid');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followingId: 'uid' } }),
      );
      expect(result).toEqual(followers);
    });
  });

  describe('getFollowing', () => {
    it('returns users being followed', async () => {
      const following = [{ followerId: 'uid', followingId: 'y' }];
      mockRepository.find.mockResolvedValue(following);

      const result = await service.getFollowing('uid');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followerId: 'uid' } }),
      );
      expect(result).toEqual(following);
    });
  });

  describe('isFollowing', () => {
    it('returns true when following', async () => {
      mockRepository.existsBy.mockResolvedValue(true);
      expect(await service.isFollowing('a', 'b')).toBe(true);
    });

    it('returns false when not following', async () => {
      mockRepository.existsBy.mockResolvedValue(false);
      expect(await service.isFollowing('a', 'b')).toBe(false);
    });
  });
});
