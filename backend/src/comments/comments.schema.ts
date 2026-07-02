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
  userId: MongooseSchema.Types.ObjectId;

  @Field(() => ID)
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  })
  postId: MongooseSchema.Types.ObjectId;

  @Field(() => ID, { nullable: true })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Comment',
    required: false,
    index: true,
  })
  parentId?: MongooseSchema.Types.ObjectId;

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
