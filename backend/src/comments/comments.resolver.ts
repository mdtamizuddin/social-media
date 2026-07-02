import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './comments.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.schema';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private commentsService: CommentsService) {}

  @Mutation(() => Comment)
  @UseGuards(GqlAuthGuard)
  async createComment(
    @CurrentUser() user: User,
    @Args('postId') postId: string,
    @Args('content') content: string,
    @Args({ name: 'parentId', type: () => String, nullable: true })
    parentId?: string,
  ): Promise<Comment> {
    return this.commentsService.createComment(
      user._id.toString(),
      postId,
      content,
      parentId,
    );
  }

  @Query(() => [Comment])
  async comments(@Args('postId') postId: string): Promise<Comment[]> {
    return this.commentsService.getCommentsByPost(postId);
  }

  @Query(() => [Comment])
  async replies(@Args('commentId') commentId: string): Promise<Comment[]> {
    return this.commentsService.getRepliesByComment(commentId);
  }
}
