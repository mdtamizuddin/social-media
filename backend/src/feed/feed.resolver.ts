import { Resolver, Query, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { Post } from '../posts/posts.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.schema';

@ObjectType()
class FeedResponse {
  @Field(() => [Post])
  posts: Post[];

  @Field({ nullable: true })
  nextCursor?: string;

  @Field()
  hasNextPage: boolean;
}

@Resolver()
export class FeedResolver {
  constructor(private feedService: FeedService) {}

  @Query(() => FeedResponse)
  @UseGuards(GqlAuthGuard)
  async homeFeed(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<FeedResponse> {
    return this.feedService.getHomeFeed(user._id.toString(), limit, cursor);
  }

  @Query(() => FeedResponse)
  async exploreFeed(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<FeedResponse> {
    return this.feedService.getExploreFeed(limit, cursor);
  }
}
