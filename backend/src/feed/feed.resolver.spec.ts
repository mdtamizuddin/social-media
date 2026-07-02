import { Test, TestingModule } from '@nestjs/testing';
import { FeedResolver } from './feed.resolver';
import { FeedService } from './feed.service';
import { User } from '../users/user.schema';

describe('FeedResolver', () => {
  let resolver: FeedResolver;
  let service: FeedService;

  const mockFeedService = {
    getHomeFeed: jest.fn(),
    getExploreFeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedResolver,
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    }).compile();

    resolver = module.get<FeedResolver>(FeedResolver);
    service = module.get<FeedService>(FeedService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('homeFeed', () => {
    it('should call feedService.getHomeFeed and return result', async () => {
      const user = { _id: 'user_id' } as User;
      const result = { posts: [], hasNextPage: false };
      mockFeedService.getHomeFeed.mockResolvedValue(result);

      expect(await resolver.homeFeed(user, 10, 'cursor_id')).toEqual(result);
      expect(service.getHomeFeed).toHaveBeenCalledWith(
        'user_id',
        10,
        'cursor_id',
      );
    });
  });

  describe('exploreFeed', () => {
    it('should call feedService.getExploreFeed and return result', async () => {
      const result = { posts: [], hasNextPage: false };
      mockFeedService.getExploreFeed.mockResolvedValue(result);

      expect(await resolver.exploreFeed(10, 'cursor_id')).toEqual(result);
      expect(service.getExploreFeed).toHaveBeenCalledWith(10, 'cursor_id');
    });
  });
});
