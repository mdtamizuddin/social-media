import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from '../posts/posts.schema';
import { FollowsService } from '../follows/follows.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private followsService: FollowsService,
    private redisService: RedisService,
  ) { }

  async getHomeFeed(
    userId: string,
    limit: number = 10,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor?: string; hasNextPage: boolean }> {
    const isFirstPage = !cursor;
    const cacheKey = `feed:${userId}:${limit}`;

    // Try to get from Redis cache for first page only
    if (isFirstPage) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          // Rehydrate Date objects from ISO strings
          const rehydratedPosts = parsed.posts.map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
          }));

          // Return cached feed
          return {
            posts: rehydratedPosts,
            nextCursor: parsed.nextCursor,
            hasNextPage: parsed.hasNextPage,
          };
        } catch {
          // ignore parsing error and fetch from DB
        }
      }
    }

    // Get list of followed user IDs
    const following = await this.followsService.getFollowing(userId);
    const followingIds = following.map((u) => u._id);

    // Always include the user's own posts in their feed
    const authorIds = [...followingIds, new Types.ObjectId(userId)];

    const query: any = { authorId: { $in: authorIds } };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Fetch limit + 1 posts to determine if there's a next page
    const posts = (await this.postModel
      .find(query)
      .populate('authorId')
      .sort({ _id: -1 }) // Sorting by _id desc is equivalent to createdAt desc and has better index support
      .limit(limit + 1)
      .exec()) as any;

    const hasNextPage = posts.length > limit;
    const feedPosts = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage
      ? feedPosts[feedPosts.length - 1]._id.toString()
      : undefined;

    const result = {
      posts: feedPosts,
      nextCursor,
      hasNextPage,
    };

    // Cache first page results in Redis for 60 seconds
    if (isFirstPage) {
      await this.redisService.set(cacheKey, JSON.stringify(result), 60);
    }

    return result;
  }

  async getExploreFeed(
    limit: number = 10,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor?: string; hasNextPage: boolean }> {
    const query: any = {};

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    // Explore feed gets trending/all posts sorted by _id desc
    const posts = (await this.postModel
      .find(query)
      .populate('authorId')
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec()) as any;

    const hasNextPage = posts.length > limit;
    const feedPosts = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage
      ? feedPosts[feedPosts.length - 1]._id.toString()
      : undefined;

    return {
      posts: feedPosts,
      nextCursor,
      hasNextPage,
    };
  }

  async invalidateFeedCache(userId: string): Promise<void> {
    // Delete the home feed caches for this user
    // In production we would scan/delete keys match `feed:${userId}:*`
    const cacheKeyPattern = `feed:${userId}:10`; // assuming standard limit 10
    await this.redisService.del(cacheKeyPattern);
  }
}
