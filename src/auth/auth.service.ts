import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserRole, UserDocument } from '../users/schema/user.schema';
import { FarmerSignUpDto } from './dto/farmer-signup.dto';
import { BuyerSignUpDto } from './dto/buyer-signup.dto';
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

  async farmerSignUp(dto: FarmerSignUpDto): Promise<ApiResponse> {
    const {
      fullName,
      phone,
      email,
      state,
      farmAddress,
      businessName,
      password,
    } = dto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.create({
      fullName,
      phone,
      email,
      state,
      password: hashedPassword,
      roles: [UserRole.FARMER],
      currentRole: UserRole.FARMER,
      farmerData: {
        farmAddress,
        businessName,
      },
    });

    return { message: 'Farmer signed up successfully' };
  }

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
      buyerData: { houseAddress: dto.houseAddress },
      language: 'en',
      notifications: { email: true, sms: false, push: true },
    });

    await user.save();
    return { message: 'Buyer registered successfully' };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userModel
      .findOne({ email })
      .select(
        'email password roles currentRole farmerData buyerData language notifications',
      )
      .exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.currentRole) {
      throw new BadRequestException(
        'User account is incomplete: missing current role',
      );
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
        language: user.language,
        notifications: user.notifications,
      },
    };
  }

  async getUserRoles(userId: string): Promise<{
    availableRoles: UserRole[];
    currentRole: UserRole;
    canCreateRole?: UserRole;
  }> {
    const user = await this.userModel
      .findById(userId)
      .select('roles currentRole language notifications')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.currentRole) {
      throw new BadRequestException(
        'User account is incomplete: missing current role',
      );
    }

    let canCreateRole: UserRole | undefined;
    if (user.roles.length === 1) {
      if (user.roles.includes(UserRole.BUYER)) {
        canCreateRole = UserRole.FARMER;
      } else if (user.roles.includes(UserRole.FARMER)) {
        canCreateRole = UserRole.BUYER;
      }
    }

    return {
      availableRoles: user.roles,
      currentRole: user.currentRole,
      canCreateRole,
    };
  }

  async switchRole(userId: string, dto: SwitchRoleDto): Promise<AuthResponse> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'email password roles currentRole farmerData buyerData language notifications',
      )
      .exec();
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
        language: user.language,
        notifications: user.notifications,
      },
    };
  }

  async createFarmerRole(
    userId: string,
    dto: CreateFarmerRoleDto,
  ): Promise<AuthResponse> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'email password roles currentRole farmerData buyerData language notifications',
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.roles.includes(UserRole.FARMER)) {
      throw new ConflictException(
        'Farmer role already exists for this account',
      );
    }

    if (user.roles.length >= 2) {
      throw new BadRequestException(
        'You already have the maximum number of roles (2)',
      );
    }

    if (!user.roles.includes(UserRole.BUYER)) {
      throw new BadRequestException(
        'Only buyers can create additional farmer roles',
      );
    }

    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;

    user.roles.push(UserRole.FARMER);
    user.farmerData = {
      farmAddress: dto.farmAddress,
      businessName: dto.businessName ?? '',
    };

    Object.assign(user, updateFields);
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
        language: user.language,
        notifications: user.notifications,
      },
    };
  }

  async createBuyerRole(
    userId: string,
    dto: CreateBuyerRoleDto,
  ): Promise<AuthResponse> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'email password roles currentRole farmerData buyerData language notifications',
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.roles.includes(UserRole.BUYER)) {
      throw new ConflictException('Buyer role already exists for this account');
    }

    if (user.roles.length >= 2) {
      throw new BadRequestException(
        'You already have the maximum number of roles (2)',
      );
    }

    if (!user.roles.includes(UserRole.FARMER)) {
      throw new BadRequestException(
        'Only farmers can create additional buyer roles',
      );
    }

    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;

    user.roles.push(UserRole.BUYER);
    user.buyerData = {
      houseAddress: dto.houseAddress,
    };

    Object.assign(user, updateFields);
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
        language: user.language,
        notifications: user.notifications,
      },
    };
  }

  async getFarmerProfile(userId: string): Promise<{ businessName: string }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.farmerData || !user.farmerData.businessName) {
      throw new HttpException('Farmer profile not found', HttpStatus.NOT_FOUND);
    }
    return { businessName: user.farmerData.businessName };
  }

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
