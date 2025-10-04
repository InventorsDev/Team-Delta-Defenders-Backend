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
import { FarmerSignUpDto } from './dto/farmer-signup.dto';
import { BuyerSignUpDto } from './dto/buyer-signup.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  SwitchRoleDto,
  CreateFarmerRoleDto,
  CreateBuyerRoleDto,
} from './dto/switch-role.dto';
import { UserRole } from '../users/schema/user.schema';
import type {
  AuthResponse,
  ApiResponse,
  UserPayload,
} from '../types/global.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // PUBLIC ROUTES
  @Public()
  @Post('farmers/signup')
  @HttpCode(HttpStatus.CREATED)
  async farmerSignUp(@Body() dto: FarmerSignUpDto): Promise<ApiResponse> {
    return this.authService.farmerSignUp(dto);
  }

  @Public()
  @Post('buyers/signup')
  @HttpCode(HttpStatus.CREATED)
  async buyerSignUp(@Body() dto: BuyerSignUpDto): Promise<ApiResponse> {
    return this.authService.buyerSignUp(dto);
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

  // PROTECTED ROUTES - GENERAL
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(): ApiResponse {
    return { message: 'Logged out successfully' };
  }

  // ROLE MANAGEMENT ROUTES
  @Get('roles')
  @UseGuards(AuthGuard('jwt'))
  async getUserRoles(@CurrentUser() user: UserPayload): Promise<{
    availableRoles: UserRole[];
    currentRole: UserRole;
    canCreateRole?: UserRole;
  }> {
    return this.authService.getUserRoles(user.id);
  }

  @Post('switch-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async switchRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: SwitchRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.switchRole(user.id, dto);
  }

  @Post('create-farmer-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createFarmerRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateFarmerRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.createFarmerRole(user.id, dto);
  }

  @Post('create-buyer-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createBuyerRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBuyerRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.createBuyerRole(user.id, dto);
  }

  // DASHBOARD ROUTES
  @Get('farmer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async farmerDashboard(
    @CurrentUser() user: UserPayload,
  ): Promise<ApiResponse> {
    const farmer = await this.authService.getFarmerProfile(user.id);
    return {
      message: `Welcome to your farmer dashboard, ${farmer.businessName}!`,
    };
  }

  @Get('buyer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.BUYER)
  buyerDashboard(@CurrentUser() user: UserPayload): ApiResponse {
    return { message: `Welcome to your buyer dashboard, ${user.id}!` };
  }
}
