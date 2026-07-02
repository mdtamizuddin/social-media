import { Test, TestingModule } from '@nestjs/testing';
import { FollowsResolver } from './follows.resolver';
import { FollowsService } from './follows.service';
import { User } from '../users/user.schema';

describe('FollowsResolver', () => {
  let resolver: FollowsResolver;
  let service: FollowsService;

  const mockFollowsService = {
    follow: jest.fn(),
    unfollow: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    isFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsResolver,
        {
          provide: FollowsService,
          useValue: mockFollowsService,
        },
      ],
    }).compile();

    resolver = module.get<FollowsResolver>(FollowsResolver);
    service = module.get<FollowsService>(FollowsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('followUser', () => {
    it('should call followsService.follow and return true', async () => {
      const user = { _id: 'follower_id' } as User;
      mockFollowsService.follow.mockResolvedValue(true);

      expect(await resolver.followUser(user, 'following_id')).toBe(true);
      expect(service.follow).toHaveBeenCalledWith(
        'follower_id',
        'following_id',
      );
    });
  });

  describe('unfollowUser', () => {
    it('should call followsService.unfollow and return true', async () => {
      const user = { _id: 'follower_id' } as User;
      mockFollowsService.unfollow.mockResolvedValue(true);

      expect(await resolver.unfollowUser(user, 'following_id')).toBe(true);
      expect(service.unfollow).toHaveBeenCalledWith(
        'follower_id',
        'following_id',
      );
    });
  });

  describe('followers', () => {
    it('should call followsService.getFollowers and return user list', async () => {
      const users = [{ username: 'follower1' }] as User[];
      mockFollowsService.getFollowers.mockResolvedValue(users);

      expect(await resolver.followers('user_id')).toEqual(users);
      expect(service.getFollowers).toHaveBeenCalledWith('user_id');
    });
  });

  describe('following', () => {
    it('should call followsService.getFollowing and return user list', async () => {
      const users = [{ username: 'following1' }] as User[];
      mockFollowsService.getFollowing.mockResolvedValue(users);

      expect(await resolver.following('user_id')).toEqual(users);
      expect(service.getFollowing).toHaveBeenCalledWith('user_id');
    });
  });

  describe('isFollowing', () => {
    it('should call followsService.isFollowing and return boolean', async () => {
      const user = { _id: 'follower_id' } as User;
      mockFollowsService.isFollowing.mockResolvedValue(true);

      expect(await resolver.isFollowing(user, 'following_id')).toBe(true);
      expect(service.isFollowing).toHaveBeenCalledWith(
        'follower_id',
        'following_id',
      );
    });
  });
});
