import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { User } from '../users/user.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver()
export class FollowsResolver {
  constructor(private followsService: FollowsService) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async followUser(
    @CurrentUser() user: User,
    @Args('followingId') followingId: string,
  ): Promise<boolean> {
    return this.followsService.follow(user._id.toString(), followingId);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async unfollowUser(
    @CurrentUser() user: User,
    @Args('followingId') followingId: string,
  ): Promise<boolean> {
    return this.followsService.unfollow(user._id.toString(), followingId);
  }

  @Query(() => [User])
  async followers(@Args('userId') userId: string): Promise<User[]> {
    return this.followsService.getFollowers(userId);
  }

  @Query(() => [User])
  async following(@Args('userId') userId: string): Promise<User[]> {
    return this.followsService.getFollowing(userId);
  }

  @Query(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async isFollowing(
    @CurrentUser() user: User,
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return this.followsService.isFollowing(user._id.toString(), userId);
  }
}
