import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';

export type PostDocument = Post & Document;

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

registerEnumType(ReactionType, {
  name: 'ReactionType',
});

@ObjectType()
export class ReactionBreakdown {
  @Field(() => Number)
  LIKE: number;

  @Field(() => Number)
  LOVE: number;

  @Field(() => Number)
  HAHA: number;

  @Field(() => Number)
  WOW: number;

  @Field(() => Number)
  SAD: number;

  @Field(() => Number)
  ANGRY: number;
}

@ObjectType()
@Schema({ timestamps: true })
export class Post {
  @Field(() => ID)
  _id: string;

  @Field(() => User)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  authorId: any;

  @Field()
  @Prop({ required: true, trim: true })
  caption: string;

  @Field(() => [String])
  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Field(() => Number)
  @Prop({ default: 0 })
  reactionCount: number;

  @Field(() => ReactionBreakdown)
  @Prop({
    type: {
      LIKE: { type: Number, default: 0 },
      LOVE: { type: Number, default: 0 },
      HAHA: { type: Number, default: 0 },
      WOW: { type: Number, default: 0 },
      SAD: { type: Number, default: 0 },
      ANGRY: { type: Number, default: 0 },
    },
    default: { LIKE: 0, LOVE: 0, HAHA: 0, WOW: 0, SAD: 0, ANGRY: 0 },
  })
  reactionBreakdown: ReactionBreakdown;

  @Field(() => Number)
  @Prop({ default: 0 })
  commentCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const PostSchema: MongooseSchema = SchemaFactory.createForClass(Post);
