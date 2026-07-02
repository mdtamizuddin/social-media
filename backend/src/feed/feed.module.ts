import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedResolver } from './feed.resolver';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [FollowsModule, PostsModule],
  providers: [FeedService, FeedResolver],
})
export class FeedModule {}
