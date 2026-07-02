import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './posts.schema';
import { Reaction, ReactionSchema } from './reactions.schema';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Reaction.name, schema: ReactionSchema },
    ]),
    UploadModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [PostsService, PostsResolver],
  exports: [PostsService, MongooseModule],
})
export class PostsModule {}
