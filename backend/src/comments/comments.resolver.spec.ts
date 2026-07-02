import { Test, TestingModule } from '@nestjs/testing';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';
import { Comment } from './comments.schema';
import { User } from '../users/user.schema';

describe('CommentsResolver', () => {
  let resolver: CommentsResolver;
  let service: CommentsService;

  const mockCommentsService = {
    createComment: jest.fn(),
    getCommentsByPost: jest.fn(),
    getRepliesByComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsResolver,
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    resolver = module.get<CommentsResolver>(CommentsResolver);
    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createComment', () => {
    it('should call commentsService.createComment and return comment', async () => {
      const user = { _id: 'user_id' } as User;
      const comment = { content: 'nice post' } as Comment;
      mockCommentsService.createComment.mockResolvedValue(comment);

      expect(
        await resolver.createComment(user, 'post_id', 'nice post', 'parent_id'),
      ).toEqual(comment);
      expect(service.createComment).toHaveBeenCalledWith(
        'user_id',
        'post_id',
        'nice post',
        'parent_id',
      );
    });
  });

  describe('comments', () => {
    it('should call commentsService.getCommentsByPost and return comments list', async () => {
      const comments = [{ content: 'c1' }] as Comment[];
      mockCommentsService.getCommentsByPost.mockResolvedValue(comments);

      expect(await resolver.comments('post_id')).toEqual(comments);
      expect(service.getCommentsByPost).toHaveBeenCalledWith('post_id');
    });
  });

  describe('replies', () => {
    it('should call commentsService.getRepliesByComment and return replies list', async () => {
      const replies = [{ content: 'r1' }] as Comment[];
      mockCommentsService.getRepliesByComment.mockResolvedValue(replies);

      expect(await resolver.replies('comment_id')).toEqual(replies);
      expect(service.getRepliesByComment).toHaveBeenCalledWith('comment_id');
    });
  });
});
