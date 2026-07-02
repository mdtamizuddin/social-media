import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, ReactionType } from './posts.schema';
import { Reaction } from './reactions.schema';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.schema';
import { RealTimeService } from '../realtime/realtime.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Reaction.name) private reactionModel: Model<Reaction>,
    private uploadService: UploadService,
    private notificationsService: NotificationsService,
    private realTimeService: RealTimeService,
  ) {}

  async createPost(
    authorId: string,
    caption: string,
    mediaBase64s: string[],
  ): Promise<Post> {
    const mediaUrls: string[] = [];

    for (const base64 of mediaBase64s) {
      const url = await this.uploadService.uploadImage(base64, 'posts');
      mediaUrls.push(url);
    }

    const newPost = new this.postModel({
      authorId: new Types.ObjectId(authorId),
      caption,
      mediaUrls,
      reactionCount: 0,
      reactionBreakdown: {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      },
      commentCount: 0,
    });

    const saved = await newPost.save();
    return saved.populate('authorId');
  }

  async findById(postId: string): Promise<Post | null> {
    return this.postModel.findById(postId).populate('authorId').exec();
  }

  async deletePost(postId: string, authorId: string): Promise<boolean> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId.toString() !== authorId) {
      throw new BadRequestException('Not authorized to delete this post');
    }

    // Delete post media from Cloudinary (optional MVP enhancement, we could extract public_ids, but for now we delete DB record)
    await this.postModel.deleteOne({ _id: post._id }).exec();
    await this.reactionModel.deleteMany({ postId: post._id } as any).exec();
    // Comments delete is handled in comments module or cascading

    return true;
  }

  async reactToPost(
    userId: string,
    postId: string,
    type: ReactionType,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const userOid = new Types.ObjectId(userId);
    const postOid = new Types.ObjectId(postId);

    const existingReaction = await this.reactionModel.findOne({
      userId: userOid,
      postId: postOid,
    } as any);

    // Initialize reactionBreakdown if null
    if (!post.reactionBreakdown) {
      post.reactionBreakdown = {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      };
    }

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle reaction off
        await this.reactionModel.deleteOne({ _id: existingReaction._id });
        post.reactionCount = Math.max(0, post.reactionCount - 1);
        post.reactionBreakdown[type] = Math.max(
          0,
          (post.reactionBreakdown[type] || 0) - 1,
        );
      } else {
        // Change reaction type
        const oldType = existingReaction.type;
        existingReaction.type = type;
        await existingReaction.save();

        post.reactionBreakdown[oldType] = Math.max(
          0,
          (post.reactionBreakdown[oldType] || 0) - 1,
        );
        post.reactionBreakdown[type] = (post.reactionBreakdown[type] || 0) + 1;
      }
    } else {
      // Create new reaction
      const newReaction = new this.reactionModel({
        userId: userOid,
        postId: postOid,
        type,
      });
      await newReaction.save();

      post.reactionCount += 1;
      post.reactionBreakdown[type] = (post.reactionBreakdown[type] || 0) + 1;

      // Create reaction notification
      await this.notificationsService.createNotification({
        recipientId: post.authorId.toString(),
        senderId: userId,
        type: NotificationType.REACTION,
        postId: post._id.toString(),
      });
    }

    post.markModified('reactionBreakdown');
    const saved = await post.save();
    const populated = await saved.populate('authorId');

    // Broadcast update in real-time
    await this.realTimeService.trigger(
      `post-${postId}`,
      'post:reacted',
      populated,
    );

    return populated;
  }

  async getPostReactionForUser(
    userId: string,
    postId: string,
  ): Promise<ReactionType | null> {
    const reaction = await this.reactionModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    } as any);
    return reaction ? reaction.type : null;
  }

  async incrementCommentCount(postId: string): Promise<void> {
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });
  }

  async decrementCommentCount(postId: string): Promise<void> {
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentCount: -1 },
    });
  }

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    return this.postModel
      .find({ authorId: new Types.ObjectId(authorId) } as any)
      .populate('authorId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
