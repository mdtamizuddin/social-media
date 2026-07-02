import { Test, TestingModule } from '@nestjs/testing';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { Post, ReactionType } from './posts.schema';
import { User } from '../users/user.schema';

describe('PostsResolver', () => {
  let resolver: PostsResolver;
  let service: PostsService;

  const mockPostsService = {
    findById: jest.fn(),
    createPost: jest.fn(),
    deletePost: jest.fn(),
    reactToPost: jest.fn(),
    getPostReactionForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsResolver,
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    resolver = module.get<PostsResolver>(PostsResolver);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('post', () => {
    it('should call postsService.findById and return post', async () => {
      const post = { caption: 'test' } as Post;
      mockPostsService.findById.mockResolvedValue(post);

      expect(await resolver.post('post_id')).toEqual(post);
      expect(service.findById).toHaveBeenCalledWith('post_id');
    });
  });

  describe('createPost', () => {
    it('should call postsService.createPost and return post', async () => {
      const user = { _id: 'author_id' } as User;
      const post = { caption: 'hello', mediaUrls: [] } as Post;
      mockPostsService.createPost.mockResolvedValue(post);

      expect(await resolver.createPost(user, 'hello', [])).toEqual(post);
      expect(service.createPost).toHaveBeenCalledWith('author_id', 'hello', []);
    });
  });

  describe('deletePost', () => {
    it('should call postsService.deletePost and return boolean', async () => {
      const user = { _id: 'author_id' } as User;
      mockPostsService.deletePost.mockResolvedValue(true);

      expect(await resolver.deletePost(user, 'post_id')).toBe(true);
      expect(service.deletePost).toHaveBeenCalledWith('post_id', 'author_id');
    });
  });

  describe('reactToPost', () => {
    it('should call postsService.reactToPost and return post', async () => {
      const user = { _id: 'user_id' } as User;
      const post = { caption: 'hello' } as Post;
      mockPostsService.reactToPost.mockResolvedValue(post);

      expect(
        await resolver.reactToPost(user, 'post_id', ReactionType.LOVE),
      ).toEqual(post);
      expect(service.reactToPost).toHaveBeenCalledWith(
        'user_id',
        'post_id',
        ReactionType.LOVE,
      );
    });
  });

  describe('myReaction', () => {
    it('should call postsService.getPostReactionForUser and return reaction type', async () => {
      const post = { _id: 'post_id' } as Post;
      const user = { _id: 'user_id' } as User;
      mockPostsService.getPostReactionForUser.mockResolvedValue(
        ReactionType.HAHA,
      );

      expect(await resolver.myReaction(post, user)).toBe(ReactionType.HAHA);
      expect(service.getPostReactionForUser).toHaveBeenCalledWith(
        'user_id',
        'post_id',
      );
    });
  });
});
