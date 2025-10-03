import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateFarmerDto } from '../auth/dto/update-farmer.dto';
import { UpdateBuyerDto } from '../auth/dto/update-buyer.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import type { Request } from 'express';

interface JwtRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // PROFILE ROUTES
  @UseGuards(JwtAuthGuard)
  @Get('profile/farmer')
  async getFarmerProfile(@Req() req: JwtRequest) {
    return this.userService.getFarmerProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/buyer')
  async getBuyerProfile(@Req() req: JwtRequest) {
    return this.userService.getBuyerProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/farmer')
  async updateFarmerProfile(
    @Req() req: JwtRequest,
    @Body() dto: UpdateFarmerDto,
  ) {
    return this.userService.updateFarmerProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/buyer')
  async updateBuyerProfile(
    @Req() req: JwtRequest,
    @Body() dto: UpdateBuyerDto,
  ) {
    return this.userService.updateBuyerProfile(req.user.id, dto);
  }

  // SETTINGS ROUTES
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getSettings(@Req() req: JwtRequest) {
    return this.userService.getSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateSettings(@Req() req: JwtRequest, @Body() dto: UpdateSettingsDto) {
    return this.userService.updateSettings(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings/password')
  async updatePassword(@Req() req: JwtRequest, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(req.user.id, dto);
  }

  // USER FETCHING ROUTES
  @UseGuards(JwtAuthGuard)
  @Get('farmers')
  async getAllFarmers() {
    return this.userService.getAllFarmers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('buyers')
  async getAllBuyers() {
    return this.userService.getAllBuyers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('farmers/:id')
  async getSingleFarmer(@Param('id') id: string) {
    return this.userService.getSingleFarmer(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('buyers/:id')
  async getSingleBuyer(@Param('id') id: string) {
    return this.userService.getSingleBuyer(id);
  }
}
