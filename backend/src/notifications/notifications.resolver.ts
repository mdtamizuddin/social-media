import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './notifications.schema';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.schema';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private notificationsService: NotificationsService) {}

  @Query(() => [Notification])
  @UseGuards(GqlAuthGuard)
  async notifications(@CurrentUser() user: User): Promise<Notification[]> {
    return this.notificationsService.getNotifications(user._id.toString());
  }

  @Mutation(() => Notification, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async readNotification(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<Notification | null> {
    return this.notificationsService.markAsRead(id, user._id.toString());
  }
}
