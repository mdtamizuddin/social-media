import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';

export type CommentDocument = Comment & Document;

@ObjectType()
@Schema({ timestamps: true })
export class Comment {
  @Field(() => ID)
  _id: string;

  @Field(() => User)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: any;

  @Field(() => ID)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  })
  postId: string;

  @Field(() => ID, { nullable: true })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Comment',
    required: false,
    index: true,
  })
  parentId?: string;

  @Field()
  @Prop({ required: true, trim: true })
  content: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const CommentSchema: MongooseSchema =
  SchemaFactory.createForClass(Comment);
