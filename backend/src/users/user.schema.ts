import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@ObjectType()
@Schema({ timestamps: true })
export class User {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true, unique: true, index: true, trim: true })
  username: string;

  @Field()
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password?: string;

  @Field()
  @Prop({ required: true, trim: true })
  displayName: string;

  @Field({ nullable: true })
  @Prop({ default: '' })
  bio?: string;

  @Field({ nullable: true })
  @Prop({ default: '' })
  avatarUrl?: string;

  @Field({ nullable: true })
  @Prop({ default: '' })
  coverPhotoUrl?: string;

  @Prop()
  refreshToken?: string;

  @Field()
  @Prop({ default: false })
  isPrivate: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const UserSchema: MongooseSchema = SchemaFactory.createForClass(User);
