import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from './schemas/user.schema';
import type {
  AuthResponse,
  ApiResponse,
  UserPayload,
} from '../types/global.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // === Public routes ===
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto): Promise<ApiResponse> {
    return this.authService.signUp(dto.name, dto.email, dto.password, dto.role);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto.email, dto.password);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ApiResponse> {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ApiResponse> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // === Protected route example ===
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@CurrentUser() user: UserPayload): {
    message: string;
    user: UserPayload;
  } {
    return { message: 'Protected profile data', user };
  }

  // === Role-based protected routes ===
  @Get('farmer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  farmerDashboard(@CurrentUser() user: UserPayload): ApiResponse {
    return { message: `Welcome to farmer dashboard, ${user.userId}!` };
  }

  @Get('buyer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.BUYER)
  buyerDashboard(@CurrentUser() user: UserPayload): ApiResponse {
    return { message: `Welcome to buyer dashboard, ${user.userId}!` };
  }
}
