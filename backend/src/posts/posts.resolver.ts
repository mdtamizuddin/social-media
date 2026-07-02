import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post, ReactionType } from './posts.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.schema';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private postsService: PostsService) {}

  @Query(() => Post, { nullable: true })
  async post(@Args('id') id: string): Promise<Post | null> {
    return this.postsService.findById(id);
  }

  @Query(() => [Post])
  async userPosts(@Args('userId') userId: string): Promise<Post[]> {
    return this.postsService.getPostsByAuthor(userId);
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @CurrentUser() user: User,
    @Args('caption') caption: string,
    @Args({ name: 'media', type: () => [String], defaultValue: [] })
    media: string[], // base64 encoded strings
  ): Promise<Post> {
    return this.postsService.createPost(user._id.toString(), caption, media);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.postsService.deletePost(id, user._id.toString());
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async reactToPost(
    @CurrentUser() user: User,
    @Args('postId') postId: string,
    @Args({ name: 'type', type: () => ReactionType }) type: ReactionType,
  ): Promise<Post> {
    return this.postsService.reactToPost(user._id.toString(), postId, type);
  }

  @ResolveField(() => ReactionType, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async myReaction(
    @Parent() post: Post,
    @CurrentUser() user: User,
  ): Promise<ReactionType | null> {
    return this.postsService.getPostReactionForUser(
      user._id.toString(),
      post._id.toString(),
    );
  }
}
