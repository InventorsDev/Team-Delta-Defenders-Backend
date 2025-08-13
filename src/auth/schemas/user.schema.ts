import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  FARMER = 'farmer',
  BUYER = 'buyer',
}

// Sub-schema for farmer-specific data
@Schema({ _id: false })
export class FarmerData {
  @Prop({ required: true })
  farmAddress!: string;

  @Prop()
  cropTypes?: string[];

  @Prop()
  businessName?: string;
}

// Sub-schema for buyer-specific data
@Schema({ _id: false })
export class BuyerData {
  @Prop({ required: false })
  houseAddress?: string;

  @Prop({ required: false })
  businessType?: string;
}

const FarmerDataSchema = SchemaFactory.createForClass(FarmerData);
const BuyerDataSchema = SchemaFactory.createForClass(BuyerData);

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

  // Array of roles this user has access to
  @Prop({
    type: [String],
    enum: UserRole,
    required: true,
    default: [],
  })
  roles!: UserRole[];

  // Current active role
  @Prop({ enum: UserRole, required: true })
  currentRole!: UserRole;

  // Role-specific data
  @Prop({ type: FarmerDataSchema })
  farmerData?: FarmerData;

  @Prop({ type: BuyerDataSchema })
  buyerData?: BuyerData;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

// Instance methods
UserSchema.methods.validatePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles.includes(role);
};

UserSchema.methods.addRole = function (role: UserRole): void {
  if (!this.hasRole(role)) {
    this.roles.push(role);
  }
};

UserSchema.methods.switchRole = function (role: UserRole): boolean {
  if (this.hasRole(role)) {
    this.currentRole = role;
    return true;
  }
  return false;
};
