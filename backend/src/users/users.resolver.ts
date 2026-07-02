import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Query(() => User, { nullable: true })
  async user(@Args('username') username: string): Promise<User | null> {
    return this.usersService.findByUsername(username);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('displayName', { nullable: true }) displayName?: string,
    @Args('bio', { nullable: true }) bio?: string,
    @Args('avatarUrl', { nullable: true }) avatarUrl?: string,
    @Args('coverPhotoUrl', { nullable: true }) coverPhotoUrl?: string,
    @Args('isPrivate', { nullable: true }) isPrivate?: boolean,
  ): Promise<User> {
    const updateData: Partial<User> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (coverPhotoUrl !== undefined) updateData.coverPhotoUrl = coverPhotoUrl;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const updated = await this.usersService.update(
      user._id.toString(),
      updateData,
    );
    if (!updated) {
      throw new Error('User not found');
    }
    return updated;
  }
}
