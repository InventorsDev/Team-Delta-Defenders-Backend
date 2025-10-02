import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;
  
  // Settings
  @Prop({ default: 'en' })
  language!: string;

  @Prop({
    type: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    _id: false,
  })
  notifications!: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
