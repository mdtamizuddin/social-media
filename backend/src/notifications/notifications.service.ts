import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from './notifications.schema';
import { RealTimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private realTimeService: RealTimeService,
  ) {}

  async createNotification(params: {
    recipientId: string;
    senderId: string;
    type: NotificationType;
    postId?: string;
    commentId?: string;
  }): Promise<Notification | null> {
    if (params.recipientId === params.senderId) {
      return null;
    }

    const newNotification = new this.notificationModel({
      recipientId: new Types.ObjectId(params.recipientId),
      senderId: new Types.ObjectId(params.senderId),
      type: params.type,
      postId: params.postId ? new Types.ObjectId(params.postId) : undefined,
      commentId: params.commentId
        ? new Types.ObjectId(params.commentId)
        : undefined,
    });

    const saved = await newNotification.save();
    const populated = await saved.populate('senderId');

    await this.realTimeService.trigger(
      `user-${params.recipientId}`,
      'notification:new',
      populated,
    );

    return populated;
  }

  async getNotifications(recipientId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipientId: new Types.ObjectId(recipientId) } as any)
      .populate('senderId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(
    notificationId: string,
    recipientId: string,
  ): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          recipientId: new Types.ObjectId(recipientId),
        } as any,
        { read: true } as any,
        { new: true },
      )
      .populate('senderId')
      .exec();
  }
}
