import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserRole, UserDocument } from './schemas/user.schema';
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

  async signUp(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<ApiResponse> {
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();

    return { message: 'User registered successfully' };
  }

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
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: extractUserData(user),
    };
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('No user found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
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
