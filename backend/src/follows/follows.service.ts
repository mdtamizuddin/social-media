import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from './follows.schema';
import { User } from '../users/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.schema';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectModel(User.name) private userModel: Model<User>,
    private notificationsService: NotificationsService,
  ) {}

  async follow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followModel.findOne({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    } as any);

    if (existing) {
      return true;
    }

    const newFollow = new this.followModel({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    });

    await newFollow.save();

    await this.notificationsService.createNotification({
      recipientId: followingId,
      senderId: followerId,
      type: NotificationType.FOLLOW,
    });

    return true;
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    await this.followModel
      .deleteOne({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      } as any)
      .exec();

    return true;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.followModel.countDocuments({
      followerId: new Types.ObjectId(followerId),
      followingId: new Types.ObjectId(followingId),
    } as any);
    return count > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followModel
      .find({ followingId: new Types.ObjectId(userId) } as any)
      .exec();

    const followerIds = follows.map((f) => f.followerId);
    return this.userModel.find({ _id: { $in: followerIds } } as any).exec();
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followModel
      .find({ followerId: new Types.ObjectId(userId) } as any)
      .exec();

    const followingIds = follows.map((f) => f.followingId);
    return this.userModel.find({ _id: { $in: followingIds } } as any).exec();
  }

  async getFollowStats(
    userId: string,
  ): Promise<{ followersCount: number; followingCount: number }> {
    const followersCount = await this.followModel.countDocuments({
      followingId: new Types.ObjectId(userId),
    } as any);
    const followingCount = await this.followModel.countDocuments({
      followerId: new Types.ObjectId(userId),
    } as any);
    return { followersCount, followingCount };
  }
}
