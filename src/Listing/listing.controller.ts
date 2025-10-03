import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ListingService } from './listing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../users/schema/user.schema';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
  FarmerListingQueryDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/listing.dto';
import type { UserPayload, ApiResponse } from '../types/global.types';
import { ListingStatus } from './schemas/listing.schema';

@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  // === ADDRESS MANAGEMENT (FARMERS ONLY) ===

  @Post('addresses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @CurrentUser() user: UserPayload,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<ApiResponse> {
    return this.listingService.createAddress(user.id, createAddressDto);
  }

  @Get('addresses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async getFarmerAddresses(@CurrentUser() user: UserPayload) {
    return this.listingService.getFarmerAddresses(user.id);
  }

  @Put('addresses/:addressId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async updateAddress(
    @CurrentUser() user: UserPayload,
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<ApiResponse> {
    return this.listingService.updateAddress(
      user.id,
      addressId,
      updateAddressDto,
    );
  }

  @Delete('addresses/:addressId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.OK)
  async deleteAddress(
    @CurrentUser() user: UserPayload,
    @Param('addressId') addressId: string,
  ): Promise<ApiResponse> {
    return this.listingService.deleteAddress(user.id, addressId);
  }

  // === LISTING MANAGEMENT (FARMERS ONLY) ===

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.CREATED)
  async createListing(
    @CurrentUser() user: UserPayload,
    @Body() createListingDto: CreateListingDto,
  ): Promise<ApiResponse> {
    return this.listingService.createListing(user.id, createListingDto);
  }

  @Put(':listingId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async updateListing(
    @CurrentUser() user: UserPayload,
    @Param('listingId') listingId: string,
    @Body() updateListingDto: UpdateListingDto,
  ): Promise<ApiResponse> {
    return this.listingService.updateListing(
      user.id,
      listingId,
      updateListingDto,
    );
  }

  @Delete(':listingId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.OK)
  async deleteListing(
    @CurrentUser() user: UserPayload,
    @Param('listingId') listingId: string,
  ): Promise<ApiResponse> {
    return this.listingService.deleteListing(user.id, listingId);
  }

  // Get farmer's own listings (FARMERS ONLY)
  @Get('my-listings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async getFarmerListings(
    @CurrentUser() user: UserPayload,
    @Query() query: FarmerListingQueryDto,
  ) {
    return this.listingService.getFarmerListings(user.id, query);
  }

  // === PUBLIC AND BUYER ACCESSIBLE ROUTES ===

  // Get all active listings (PUBLIC - accessible to everyone including buyers)
  @Public()
  @Get()
  async getAllListings(@Query() query: ListingQueryDto) {
    return this.listingService.getAllListings(query);
  }

  // Get single listing by ID (PUBLIC - accessible to everyone)
  @Public()
  @Get(':listingId')
  async getSingleListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user?: UserPayload,
  ) {
    // Check if the user is the owner of the listing
    const isOwner = user
      ? await this.isListingOwner(user.id, listingId)
      : false;
    return this.listingService.getSingleListing(listingId, user?.id, isOwner);
  }

  // Get listings by category (PUBLIC)
  @Public()
  @Get('category/:category')
  async getListingsByCategory(
    @Param('category') category: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listingService.getListingsByCategory(category, limit);
  }

  // Get popular listings (PUBLIC)
  @Public()
  @Get('featured/popular')
  async getPopularListings(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listingService.getPopularListings(limit);
  }

  // Get recent listings (PUBLIC)
  @Public()
  @Get('featured/recent')
  async getRecentListings(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listingService.getRecentListings(limit);
  }

  // === PROTECTED ROUTES FOR AUTHENTICATED USERS ===

  // Increment inquiry count when someone contacts about a listing
  @Post(':listingId/inquire')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async inquireAboutListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<ApiResponse> {
    // Ensure user is not inquiring about their own listing
    const isOwner = await this.isListingOwner(user.id, listingId);
    if (isOwner) {
      return { message: 'Cannot inquire about your own listing' };
    }

    await this.listingService.incrementInquiryCount(listingId);
    return { message: 'Inquiry recorded successfully' };
  }

  // === FARMER SPECIFIC ROUTES (Additional functionality) ===

  // Get listing analytics for farmers
  @Get('my-listings/:listingId/analytics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async getListingAnalytics(
    @CurrentUser() user: UserPayload,
    @Param('listingId') listingId: string,
  ) {
    // Verify ownership
    const isOwner = await this.isListingOwner(user.id, listingId);
    if (!isOwner) {
      throw new Error('Unauthorized access to listing analytics');
    }

    const { listing } = await this.listingService.getSingleListing(
      listingId,
      user.id,
      true,
    );

    return {
      analytics: {
        viewCount: listing.viewCount,
        inquiryCount: listing.inquiryCount,
        createdAt: listing.createdAt,
        status: listing.status,
        daysActive: Math.floor(
          (Date.now() - new Date(listing.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      },
    };
  }

  // Bulk update listing status (for farmers to quickly activate/deactivate multiple listings)
  @Put('bulk-update-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.FARMER)
  async bulkUpdateListingStatus(
    @CurrentUser() user: UserPayload,
    @Body() body: { listingIds: string[]; status: string },
  ): Promise<ApiResponse> {
    const { listingIds, status } = body;

    // Update multiple listings belonging to the farmer
    await Promise.all(
      listingIds.map((id) =>
        this.listingService.updateListing(user.id, id, {
          status: status as ListingStatus,
        }),
      ),
    );

    return {
      message: `${listingIds.length} listings updated successfully`,
    };
  }

  // === HELPER METHODS ===

  private async isListingOwner(
    userId: string,
    listingId: string,
  ): Promise<boolean> {
    try {
      const { listing } = await this.listingService.getSingleListing(
        listingId,
        userId,
        true,
      );
      return listing.farmerId.toString() === userId;
    } catch {
      return false;
    }
  }
}
