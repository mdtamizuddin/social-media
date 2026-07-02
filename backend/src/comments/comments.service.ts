import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from './comments.schema';
import { PostsService } from '../posts/posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.schema';
import { RealTimeService } from '../realtime/realtime.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private postsService: PostsService,
    private notificationsService: NotificationsService,
    private realTimeService: RealTimeService,
  ) {}

  async createComment(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> {
    const post = await this.postsService.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const newComment = new this.commentModel({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
      parentId: parentId ? new Types.ObjectId(parentId) : undefined,
      content,
    });

    const saved = await newComment.save();
    const populated = await saved.populate('userId');

    // Increment post's comment counter
    await this.postsService.incrementCommentCount(postId);

    if (parentId) {
      // It is a reply
      const parentComment = await this.commentModel.findById(parentId);
      if (parentComment) {
        // Trigger REPLY notification to the parent comment owner
        await this.notificationsService.createNotification({
          recipientId: (parentComment.userId as any).toString(),
          senderId: userId,
          type: NotificationType.REPLY,
          postId,
          commentId: parentComment._id.toString(),
        });
      }

      // Broadcast real-time reply event
      await this.realTimeService.trigger(
        `post-${postId}`,
        'reply:new',
        populated,
      );
    } else {
      // It is a root comment, trigger COMMENT notification to the post owner
      await this.notificationsService.createNotification({
        recipientId: (post.authorId as any).toString(),
        senderId: userId,
        type: NotificationType.COMMENT,
        postId,
      });

      // Broadcast real-time comment event
      await this.realTimeService.trigger(
        `post-${postId}`,
        'comment:new',
        populated,
      );
    }

    return populated;
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({
        postId: new Types.ObjectId(postId),
        parentId: { $exists: false },
      } as any)
      .populate('userId')
      .sort({ createdAt: 1 })
      .exec();
  }

  async getRepliesByComment(commentId: string): Promise<Comment[]> {
    return this.commentModel
      .find({
        parentId: new Types.ObjectId(commentId),
      } as any)
      .populate('userId')
      .sort({ createdAt: 1 })
      .exec();
  }
}
