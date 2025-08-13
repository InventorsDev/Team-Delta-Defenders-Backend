import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserRole, UserDocument } from './schemas/user.schema';
import { FarmerSignUpDto } from './dto/farmer-signup.dto';
import { BuyerSignUpDto } from './dto/buyer-signup.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import {
  SwitchRoleDto,
  CreateFarmerRoleDto,
  CreateBuyerRoleDto,
} from './dto/switch-role.dto';
import type { AuthResponse, ApiResponse } from '../types/global.types';
import {
  toObjectIdString,
  extractUserData,
  getEnvVar,
} from '../common/utils/type.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // Farmer signup - creates initial account with farmer role
  async farmerSignUp(dto: FarmerSignUpDto): Promise<ApiResponse> {
    const existingUser = await this.userModel
      .findOne({ email: dto.email })
      .exec();

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      state: dto.state,
      password: hashedPassword,
      roles: [UserRole.FARMER],
      currentRole: UserRole.FARMER,
      farmerData: {
        farmAddress: dto.farmAddress,
      },
    });

    await user.save();
    return { message: 'Farmer registered successfully' };
  }

  // Buyer signup - creates initial account with buyer role
  async buyerSignUp(dto: BuyerSignUpDto): Promise<ApiResponse> {
    const existingUser = await this.userModel
      .findOne({ email: dto.email })
      .exec();

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      state: dto.state,
      password: hashedPassword,
      roles: [UserRole.BUYER],
      currentRole: UserRole.BUYER,
      buyerData: {},
    });

    await user.save();
    return { message: 'Buyer registered successfully' };
  }

  // User sign in
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: toObjectIdString(user._id),
      role: user.currentRole,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        ...extractUserData(user),
        availableRoles: user.roles,
        currentRole: user.currentRole,
      },
    };
  }

  // Switch between existing roles
  async switchRole(userId: string, dto: SwitchRoleDto): Promise<AuthResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes(dto.role)) {
      throw new BadRequestException(
        `You don't have access to ${dto.role} role. Please create the role first.`,
      );
    }

    user.currentRole = dto.role;
    await user.save();

    const payload = {
      sub: toObjectIdString(user._id),
      role: user.currentRole,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        ...extractUserData(user),
        availableRoles: user.roles,
        currentRole: user.currentRole,
      },
    };
  }

  // Create additional farmer role for existing user
  async createFarmerRole(
    userId: string,
    dto: CreateFarmerRoleDto,
  ): Promise<AuthResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.roles.includes(UserRole.FARMER)) {
      throw new ConflictException(
        'Farmer role already exists for this account',
      );
    }

    // Add farmer role and data
    user.roles.push(UserRole.FARMER);
    user.farmerData = {
      farmAddress: dto.farmAddress,
      cropTypes: dto.cropTypes,
      businessName: dto.businessName,
    };

    // Switch to the new role
    user.currentRole = UserRole.FARMER;
    await user.save();

    const payload = {
      sub: toObjectIdString(user._id),
      role: user.currentRole,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        ...extractUserData(user),
        availableRoles: user.roles,
        currentRole: user.currentRole,
      },
    };
  }

  // Create additional buyer role for existing user
  async createBuyerRole(
    userId: string,
    dto: CreateBuyerRoleDto,
  ): Promise<AuthResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.roles.includes(UserRole.BUYER)) {
      throw new ConflictException('Buyer role already exists for this account');
    }

    // Add buyer role and data
    user.roles.push(UserRole.BUYER);
    user.buyerData = {
      houseAddress: dto.houseAddress,
      businessType: dto.businessType,
    };

    // Switch to the new role
    user.currentRole = UserRole.BUYER;
    await user.save();

    const payload = {
      sub: toObjectIdString(user._id),
      role: user.currentRole,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        ...extractUserData(user),
        availableRoles: user.roles,
        currentRole: user.currentRole,
      },
    };
  }

  // Get user's available roles
  async getUserRoles(
    userId: string,
  ): Promise<{ availableRoles: UserRole[]; currentRole: UserRole }> {
    const user = await this.userModel
      .findById(userId)
      .select('roles currentRole')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      availableRoles: user.roles,
      currentRole: user.currentRole,
    };
  }

  // Get all farmers
  async getAllFarmers(): Promise<{ farmers: any[] }> {
    const farmers = await this.userModel
      .find({ roles: UserRole.FARMER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    return { farmers: farmers.map((farmer) => extractUserData(farmer)) };
  }

  // Get all buyers
  async getAllBuyers(): Promise<{ buyers: any[] }> {
    const buyers = await this.userModel
      .find({ roles: UserRole.BUYER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    return { buyers: buyers.map((buyer) => extractUserData(buyer)) };
  }

  // Get single farmer by ID
  async getSingleFarmer(id: string): Promise<{ farmer: any }> {
    const farmer = await this.userModel
      .findOne({ _id: id, roles: UserRole.FARMER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return { farmer: extractUserData(farmer) };
  }

  // Get single buyer by ID
  async getSingleBuyer(id: string): Promise<{ buyer: any }> {
    const buyer = await this.userModel
      .findOne({ _id: id, roles: UserRole.BUYER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    return { buyer: extractUserData(buyer) };
  }

  // Get farmer profile
  async getFarmerProfile(userId: string): Promise<{ farmer: any }> {
    const farmer = await this.userModel
      .findOne({ _id: userId, roles: UserRole.FARMER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    if (!farmer) {
      throw new NotFoundException('Farmer profile not found');
    }

    return { farmer: extractUserData(farmer) };
  }

  // Get buyer profile
  async getBuyerProfile(userId: string): Promise<{ buyer: any }> {
    const buyer = await this.userModel
      .findOne({ _id: userId, roles: UserRole.BUYER })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    if (!buyer) {
      throw new NotFoundException('Buyer profile not found');
    }

    return { buyer: extractUserData(buyer) };
  }

  // Update farmer profile
  async updateFarmerProfile(
    userId: string,
    dto: UpdateFarmerDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findOne({ _id: userId, roles: UserRole.FARMER })
      .exec();

    if (!user) {
      throw new NotFoundException('Farmer not found');
    }

    // Update general fields
    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;

    // Update farmer-specific data
    if (dto.farmAddress) {
      updateFields['farmerData.farmAddress'] = dto.farmAddress;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    return {
      message: 'Farmer profile updated successfully',
      data: extractUserData(updatedUser!),
    };
  }

  // Update buyer profile
  async updateBuyerProfile(
    userId: string,
    dto: UpdateBuyerDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findOne({ _id: userId, roles: UserRole.BUYER })
      .exec();

    if (!user) {
      throw new NotFoundException('Buyer not found');
    }

    // Update general fields
    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .exec();

    return {
      message: 'Buyer profile updated successfully',
      data: extractUserData(updatedUser!),
    };
  }

  // Existing methods remain the same
  async forgotPassword(email: string): Promise<ApiResponse> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    await this.sendResetEmail(user.email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findOne({
        resetPasswordToken: { $exists: true, $ne: null },
        resetPasswordExpires: { $gt: new Date() },
      })
      .exec();

    if (!user || !user.resetPasswordToken) {
      throw new BadRequestException('Token expired or invalid');
    }

    const tokenMatches = await bcrypt.compare(token, user.resetPasswordToken);
    if (!tokenMatches) {
      throw new BadRequestException('Invalid token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return { message: 'Password updated successfully' };
  }

  private async sendResetEmail(to: string, token: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: getEnvVar('EMAIL_USER'),
        pass: getEnvVar('EMAIL_PASS'),
      },
    });

    const resetUrl = `${getEnvVar('FRONTEND_URL')}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: getEnvVar('EMAIL_USER'),
      to,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this <a href="${resetUrl}">link</a> to set a new password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }
}
