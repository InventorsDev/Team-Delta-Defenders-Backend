import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  FARMER = 'farmer',
  BUYER = 'buyer',
}

@Schema({ _id: false })
export class FarmerData {
  @Prop({ required: true })
  farmAddress!: string;

  @Prop({ required: true })
  businessName!: string;
}

@Schema({ _id: false })
export class BuyerData {
  @Prop({ required: true })
  houseAddress!: string;
}

const FarmerDataSchema = SchemaFactory.createForClass(FarmerData);
const BuyerDataSchema = SchemaFactory.createForClass(BuyerData);

@Schema({ timestamps: true })
export class User {
  _id!: Types.ObjectId;
  id!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({
    type: [String],
    enum: UserRole,
    required: true,
    default: [],
    validate: {
      validator: function (roles: UserRole[]) {
        return roles.length <= 2 && new Set(roles).size === roles.length;
      },
      message: 'User can have maximum 2 unique roles',
    },
  })
  roles!: UserRole[];

  @Prop({ type: String, enum: UserRole, required: true })
  currentRole!: UserRole;

  @Prop({ type: FarmerDataSchema })
  farmerData?: FarmerData;

  @Prop({ type: BuyerDataSchema })
  buyerData?: BuyerData;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

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

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('strict', true);

UserSchema.set('toObject', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

UserSchema.methods.validatePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.hasRole = function (role: UserRole): boolean {
  return this.roles.includes(role);
};

UserSchema.methods.addRole = function (role: UserRole): void {
  if (!this.hasRole(role) && this.roles.length < 2) {
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

UserSchema.methods.canCreateRole = function (): UserRole | null {
  if (this.roles.length === 1) {
    if (this.roles.includes(UserRole.BUYER)) {
      return UserRole.FARMER;
    } else if (this.roles.includes(UserRole.FARMER)) {
      return UserRole.BUYER;
    }
  }
  return null;
};
