import { Test, TestingModule } from '@nestjs/testing';
import { FollowController } from './follow.controller';
import { FollowService } from '../service/follow.service';

const mockService = {
  follow: jest.fn(),
  unfollow: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
};

const req = { user: { id: 'user-uuid' } };

describe('FollowController', () => {
  let controller: FollowController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowController],
      providers: [{ provide: FollowService, useValue: mockService }],
    }).compile();
    controller = module.get(FollowController);
  });

  it('follow delegates to service', async () => {
    mockService.follow.mockResolvedValue(undefined);
    await controller.follow(req, 'target-uuid');
    expect(mockService.follow).toHaveBeenCalledWith('user-uuid', 'target-uuid');
  });

  it('unfollow delegates to service', async () => {
    mockService.unfollow.mockResolvedValue(undefined);
    await controller.unfollow(req, 'target-uuid');
    expect(mockService.unfollow).toHaveBeenCalledWith(
      'user-uuid',
      'target-uuid',
    );
  });

  it('getFollowers delegates to service', async () => {
    mockService.getFollowers.mockResolvedValue([]);
    const result = await controller.getFollowers(req);
    expect(mockService.getFollowers).toHaveBeenCalledWith('user-uuid');
    expect(result).toEqual([]);
  });

  it('getFollowing delegates to service', async () => {
    mockService.getFollowing.mockResolvedValue([]);
    const result = await controller.getFollowing(req);
    expect(mockService.getFollowing).toHaveBeenCalledWith('user-uuid');
    expect(result).toEqual([]);
  });
});
