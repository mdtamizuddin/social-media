import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../users/user.schema';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  REACTION = 'REACTION',
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  FOLLOW = 'FOLLOW',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
@Schema({ timestamps: true })
export class Notification {
  @Field(() => ID)
  _id: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  recipientId: MongooseSchema.Types.ObjectId;

  @Field(() => User)
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: MongooseSchema.Types.ObjectId;

  @Field(() => NotificationType)
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Field({ nullable: true })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post', required: false })
  postId?: MongooseSchema.Types.ObjectId;

  @Field({ nullable: true })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Comment',
    required: false,
  })
  commentId?: MongooseSchema.Types.ObjectId;

  @Field()
  @Prop({ default: false })
  read: boolean;

  @Field(() => Date)
  createdAt: Date;
}

export const NotificationSchema: MongooseSchema =
  SchemaFactory.createForClass(Notification);
