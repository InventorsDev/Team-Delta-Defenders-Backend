import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schema/user.schema';
import { UpdateFarmerDto } from '../auth/dto/update-farmer.dto';
import { UpdateBuyerDto } from '../auth/dto/update-buyer.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { extractUserData } from '../common/utils/type.utils';
import type { ApiResponse } from '../types/global.types';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getAllFarmers(): Promise<{ farmers: any[] }> {
    const farmers = await this.userModel
      .find({ roles: 'farmer' })
      .select(
        'fullName phone email state farmerData.businessName farmerData.farmAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    return {
      farmers: farmers.map((farmer) => ({
        ...extractUserData(farmer),
        businessName: farmer.farmerData?.businessName,
        farmAddress: farmer.farmerData?.farmAddress,
      })),
    };
  }

  async getAllBuyers(): Promise<{ buyers: any[] }> {
    const buyers = await this.userModel
      .find({ roles: 'buyer' })
      .select(
        'fullName phone email state buyerData.houseAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    return { buyers: buyers.map((buyer) => extractUserData(buyer)) };
  }

  async getSingleFarmer(id: string): Promise<{ farmer: any }> {
    const farmer = await this.userModel
      .findOne({ _id: id, roles: 'farmer' })
      .select(
        'fullName phone email state farmerData.businessName farmerData.farmAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return {
      farmer: {
        ...extractUserData(farmer),
        businessName: farmer.farmerData?.businessName,
        farmAddress: farmer.farmerData?.farmAddress,
      },
    };
  }

  async getSingleBuyer(id: string): Promise<{ buyer: any }> {
    const buyer = await this.userModel
      .findOne({ _id: id, roles: 'buyer' })
      .select(
        'fullName phone email state buyerData.houseAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    return { buyer: extractUserData(buyer) };
  }

  async getFarmerProfile(userId: string): Promise<{ farmer: any }> {
    const farmer = await this.userModel
      .findOne({ _id: userId, roles: 'farmer' })
      .select(
        'fullName phone email state farmerData.businessName farmerData.farmAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    if (!farmer) {
      throw new NotFoundException('Farmer profile not found');
    }

    return {
      farmer: {
        ...extractUserData(farmer),
        businessName: farmer.farmerData?.businessName,
        farmAddress: farmer.farmerData?.farmAddress,
      },
    };
  }

  async getBuyerProfile(userId: string): Promise<{ buyer: any }> {
    const buyer = await this.userModel
      .findOne({ _id: userId, roles: 'buyer' })
      .select(
        'fullName phone email state buyerData.houseAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    if (!buyer) {
      throw new NotFoundException('Buyer profile not found');
    }

    return { buyer: extractUserData(buyer) };
  }

  async updateFarmerProfile(
    userId: string,
    dto: UpdateFarmerDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findOne({ _id: userId, roles: 'farmer' })
      .exec();

    if (!user) {
      throw new NotFoundException('Farmer not found');
    }

    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;
    if (dto.farmAddress)
      updateFields['farmerData.farmAddress'] = dto.farmAddress;
    if (dto.businessName)
      updateFields['farmerData.businessName'] = dto.businessName;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
      .select(
        'fullName phone email state farmerData.businessName farmerData.farmAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Farmer not found');
    }

    return {
      message: 'Farmer profile updated successfully',
      data: {
        ...extractUserData(updatedUser),
        businessName: updatedUser.farmerData?.businessName,
        farmAddress: updatedUser.farmerData?.farmAddress,
      },
    };
  }

  async updateBuyerProfile(
    userId: string,
    dto: UpdateBuyerDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findOne({ _id: userId, roles: 'buyer' })
      .exec();

    if (!user) {
      throw new NotFoundException('Buyer not found');
    }

    const updateFields: any = {};
    if (dto.fullName) updateFields.fullName = dto.fullName;
    if (dto.phone) updateFields.phone = dto.phone;
    if (dto.state) updateFields.state = dto.state;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
      .select(
        'fullName phone email state buyerData.houseAddress roles currentRole createdAt updatedAt',
      )
      .exec();

    return {
      message: 'Buyer profile updated successfully',
      data: extractUserData(updatedUser!),
    };
  }

  async getSettings(
    userId: string,
  ): Promise<{ language: string; notifications: any }> {
    const user = await this.userModel
      .findById(userId)
      .select('language notifications')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      language: user.language,
      notifications: user.notifications,
    };
  }

  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateFields: any = {};
    if (dto.language) updateFields.language = dto.language;
    if (dto.notifications) updateFields.notifications = dto.notifications;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
      .select('language notifications')
      .exec();

    return {
      message: 'Settings updated successfully',
      data: {
        language: updatedUser!.language,
        notifications: updatedUser!.notifications,
      },
    };
  }

  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<ApiResponse> {
    const user = await this.userModel
      .findById(userId)
      .select('password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }
}
