import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ReactionType } from './posts.schema';

export type ReactionDocument = Reaction & Document;

@Schema({ timestamps: true })
export class Reaction {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  })
  postId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: ReactionType, required: true })
  type: ReactionType;
}

export const ReactionSchema: MongooseSchema =
  SchemaFactory.createForClass(Reaction);

// Ensure a user can react to a post only once
ReactionSchema.index({ userId: 1, postId: 1 }, { unique: true });
