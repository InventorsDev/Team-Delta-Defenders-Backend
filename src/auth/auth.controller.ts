import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
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
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import {
  SwitchRoleDto,
  CreateFarmerRoleDto,
  CreateBuyerRoleDto,
} from './dto/switch-role.dto';
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

  // Farmer signup
  @Public()
  @Post('farmers/signup')
  @HttpCode(HttpStatus.CREATED)
  async farmerSignUp(@Body() dto: FarmerSignUpDto): Promise<ApiResponse> {
    return this.authService.farmerSignUp(dto);
  }

  // Buyer signup
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

  // === Protected routes ===

  // Logout (token invalidation would be handled by frontend by removing token)
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(): ApiResponse {
    return { message: 'Logged out successfully' };
  }

  // === Switch Account Feature Routes ===

  // Get user's available roles and current role
  @Get('roles')
  @UseGuards(AuthGuard('jwt'))
  async getUserRoles(@CurrentUser() user: UserPayload): Promise<{
    availableRoles: UserRole[];
    currentRole: UserRole;
    canCreateRole?: UserRole; // The role they can create (if any)
  }> {
    return this.authService.getUserRoles(user.id);
  }

  // Switch between existing roles
  @Post('switch-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async switchRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: SwitchRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.switchRole(user.id, dto);
  }

  // Create additional farmer role (for existing buyers)
  @Post('create-farmer-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createFarmerRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateFarmerRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.createFarmerRole(user.id, dto);
  }

  // Create additional buyer role (for existing farmers)
  @Post('create-buyer-role')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createBuyerRole(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBuyerRoleDto,
  ): Promise<AuthResponse> {
    return this.authService.createBuyerRole(user.id, dto);
  }

  // === Admin/General routes (can be accessed by both roles) ===

  // Get all farmers
  @Get('farmers')
  @UseGuards(AuthGuard('jwt'))
  async getAllFarmers(): Promise<{ farmers: any[] }> {
    return this.authService.getAllFarmers();
  }

  // Get all buyers
  @Get('buyers')
  @UseGuards(AuthGuard('jwt'))
  async getAllBuyers(): Promise<{ buyers: any[] }> {
    return this.authService.getAllBuyers();
  }

  // Get single farmer by ID
  @Get('farmers/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSingleFarmer(@Param('id') id: string): Promise<{ farmer: any }> {
    return this.authService.getSingleFarmer(id);
  }

  // Get single buyer by ID
  @Get('buyers/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSingleBuyer(@Param('id') id: string): Promise<{ buyer: any }> {
    return this.authService.getSingleBuyer(id);
  }

  // === Role-based profile routes ===

  // Get farmer profile (only for farmers)
  @Get('farmers/profile/me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async getFarmerProfile(
    @CurrentUser() user: UserPayload,
  ): Promise<{ farmer: any }> {
    return this.authService.getFarmerProfile(user.id);
  }

  // Get buyer profile (only for buyers)
  @Get('buyers/profile/me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.BUYER)
  async getBuyerProfile(
    @CurrentUser() user: UserPayload,
  ): Promise<{ buyer: any }> {
    return this.authService.getBuyerProfile(user.id);
  }

  // Update farmer profile (only for farmers)
  @Patch('farmers/profile/me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async updateFarmerProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateFarmerDto,
  ): Promise<ApiResponse> {
    return this.authService.updateFarmerProfile(user.id, dto);
  }

  // Update buyer profile (only for buyers)
  @Patch('buyers/profile/me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.BUYER)
  async updateBuyerProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateBuyerDto,
  ): Promise<ApiResponse> {
    return this.authService.updateBuyerProfile(user.id, dto);
  }

  // === Role-based protected routes ===
  @Get('farmer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  farmerDashboard(@CurrentUser() user: UserPayload): ApiResponse {
    return { message: `Welcome to farmer dashboard, ${user.id}!` };
  }

  @Get('buyer-dashboard')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.BUYER)
  buyerDashboard(@CurrentUser() user: UserPayload): ApiResponse {
    return { message: `Welcome to buyer dashboard, ${user.id}!` };
  }
}
