import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { FarmerSignUpDto } from '../auth/dto/farmer-signup.dto';
import { BuyerSignUpDto } from '../auth/dto/buyer-signup.dto';
import { UpdateFarmerDto } from '../auth/dto/update-farmer.dto';
import { UpdateBuyerDto } from '../auth/dto/update-buyer.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserService } from './user.service';

interface JwtRequest extends Request {
  user: {
    userId: string;
    email?: string;
    role: string;
  };
}

@Controller('users')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // Signup & Login
  @Post('farmer-signup')
  async farmerSignUp(@Body() dto: FarmerSignUpDto) {
    return this.authService.farmerSignUp(dto);
  }

  @Post('buyer-signup')
  async buyerSignUp(@Body() dto: BuyerSignUpDto) {
    return this.authService.buyerSignUp(dto);
  }

  @Post('login')
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.signIn(dto.email, dto.password);
  }

  // Profiles
  @UseGuards(JwtAuthGuard)
  @Get('profile/farmer')
  async getFarmerProfile(@Req() req: JwtRequest) {
    return this.authService.getFarmerProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/buyer')
  async getBuyerProfile(@Req() req: JwtRequest) {
    return this.authService.getBuyerProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/farmer')
  async updateFarmerProfile(@Req() req: JwtRequest, @Body() dto: UpdateFarmerDto) {
    return this.authService.updateFarmerProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/buyer')
  async updateBuyerProfile(@Req() req: JwtRequest, @Body() dto: UpdateBuyerDto) {
    return this.authService.updateBuyerProfile(req.user.userId, dto);
  }

  // Settings
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings(@Req() req: JwtRequest) {
    return this.userService.getSettings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateSettings(@Req() req: JwtRequest, @Body() dto: UpdateSettingsDto) {
    return this.userService.updateSettings(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings/password')
  async updatePassword(@Req() req: JwtRequest, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.userId, dto);
  }


  @Get('farmer/:id')
  async getSingleFarmer(@Param('id') id: string) {
    return this.authService.getSingleFarmer(id);
  }

  @Get('buyer/:id')
  async getSingleBuyer(@Param('id') id: string) {
    return this.authService.getSingleBuyer(id);
  }
}
