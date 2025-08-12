import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  FARMER = 'farmer',
  BUYER = 'buyer',
}

@Schema({ timestamps: true })
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ enum: UserRole, required: true })
  role!: UserRole;

  // Farmer-specific field
  @Prop({
    required: function () {
      return this.role === UserRole.FARMER;
    },
  })
  farmAddress?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = User & Document;

// Add instance method to schema after creation
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.validatePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
