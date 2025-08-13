import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import {
  Listing,
  ListingDocument,
  ListingStatus,
  Address,
  AddressDocument,
} from './schemas/listing.schema';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
  FarmerListingQueryDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/listing.dto';
import type { ApiResponse } from '../types/global.types';

@Injectable()
export class ListingService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  // === ADDRESS MANAGEMENT ===

  async createAddress(
    farmerId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<ApiResponse> {
    const address = new this.addressModel({
      ...createAddressDto,
      farmerId,
    });

    await address.save();

    return {
      message: 'Address created successfully',
      data: address,
    };
  }

  async getFarmerAddresses(
    farmerId: string,
  ): Promise<{ addresses: Address[] }> {
    const addresses = await this.addressModel
      .find({ farmerId, isActive: true })
      .sort({ createdAt: -1 })
      .exec();

    return { addresses };
  }

  async updateAddress(
    farmerId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<ApiResponse> {
    const address = await this.addressModel
      .findOneAndUpdate(
        { _id: addressId, farmerId },
        { $set: updateAddressDto },
        { new: true },
      )
      .exec();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return {
      message: 'Address updated successfully',
      data: address,
    };
  }

  async deleteAddress(
    farmerId: string,
    addressId: string,
  ): Promise<ApiResponse> {
    // Check if address is being used in any active listings
    const activeListings = await this.listingModel
      .countDocuments({
        farmAddress: addressId,
        status: { $in: [ListingStatus.ACTIVE] },
      })
      .exec();

    if (activeListings > 0) {
      throw new BadRequestException(
        'Cannot delete address. It is being used in active listings.',
      );
    }

    const address = await this.addressModel
      .findOneAndUpdate(
        { _id: addressId, farmerId },
        { isActive: false },
        { new: true },
      )
      .exec();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return { message: 'Address deleted successfully' };
  }

  // === LISTING MANAGEMENT ===

  async createListing(
    farmerId: string,
    createListingDto: CreateListingDto,
  ): Promise<ApiResponse> {
    // Verify that the farm address belongs to the farmer
    const address = await this.addressModel
      .findOne({
        _id: createListingDto.farmAddress,
        farmerId,
        isActive: true,
      })
      .exec();

    if (!address) {
      throw new BadRequestException('Invalid farm address selected');
    }

    // Ensure at least one image is marked as primary
    const images = createListingDto.images;
    const hasPrimary = images.some((img) => img.isPrimary);
    if (!hasPrimary && images.length > 0) {
      images[0].isPrimary = true;
    }

    const listing = new this.listingModel({
      ...createListingDto,
      farmerId,
      images,
    });

    await listing.save();

    // Populate the address for response
    await listing.populate('farmAddress');

    return {
      message: 'Listing created successfully',
      data: listing,
    };
  }

  async updateListing(
    farmerId: string,
    listingId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<ApiResponse> {
    // If updating farm address, verify it belongs to the farmer
    if (updateListingDto.farmAddress) {
      const address = await this.addressModel
        .findOne({
          _id: updateListingDto.farmAddress,
          farmerId,
          isActive: true,
        })
        .exec();

      if (!address) {
        throw new BadRequestException('Invalid farm address selected');
      }
    }

    // Handle image updates
    if (updateListingDto.images) {
      const images = updateListingDto.images;
      const hasPrimary = images.some((img) => img.isPrimary);
      if (!hasPrimary && images.length > 0) {
        images[0].isPrimary = true;
      }
    }

    const listing = await this.listingModel
      .findOneAndUpdate(
        { _id: listingId, farmerId },
        { $set: updateListingDto },
        { new: true },
      )
      .populate('farmAddress')
      .populate('farmerId', 'fullName email phone state')
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return {
      message: 'Listing updated successfully',
      data: listing,
    };
  }

  async deleteListing(
    farmerId: string,
    listingId: string,
  ): Promise<ApiResponse> {
    const listing = await this.listingModel
      .findOneAndUpdate(
        { _id: listingId, farmerId },
        { status: ListingStatus.ARCHIVED },
        { new: true },
      )
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return { message: 'Listing deleted successfully' };
  }

  async getFarmerListings(
    farmerId: string,
    query: FarmerListingQueryDto,
  ): Promise<{
    listings: Listing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery: FilterQuery<ListingDocument> = {
      farmerId,
      status: { $ne: ListingStatus.ARCHIVED }, // Exclude archived by default
    };

    if (filters.category) filterQuery.category = filters.category;
    if (filters.status) filterQuery.status = filters.status;
    if (filters.search) {
      filterQuery.$text = { $search: filters.search };
    }
    if (filters.minPrice || filters.maxPrice) {
      filterQuery.unitPrice = {};
      if (filters.minPrice) filterQuery.unitPrice.$gte = filters.minPrice;
      if (filters.maxPrice) filterQuery.unitPrice.$lte = filters.maxPrice;
    }

    // Build sort query
    const sortQuery: any = {};
    if (query.sortBy) {
      sortQuery[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    }

    const [listings, total] = await Promise.all([
      this.listingModel
        .find(filterQuery)
        .populate('farmAddress')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.listingModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSingleListing(
    listingId: string,
    userId?: string,
    isOwner?: boolean,
  ): Promise<{ listing: Listing }> {
    const listing = await this.listingModel
      .findById(listingId)
      .populate('farmAddress')
      .populate('farmerId', 'fullName email phone state')
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // If not the owner, check if listing is active
    if (!isOwner && listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count if not the owner
    if (!isOwner) {
      await this.listingModel
        .findByIdAndUpdate(listingId, { $inc: { viewCount: 1 } })
        .exec();
    }

    return { listing };
  }

  // For buyers and general public
  async getAllListings(query: ListingQueryDto): Promise<{
    listings: Listing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    // Build filter query - only active listings for buyers
    const filterQuery: FilterQuery<ListingDocument> = {
      status: ListingStatus.ACTIVE,
    };

    if (filters.category) filterQuery.category = filters.category;
    if (filters.search) {
      filterQuery.$text = { $search: filters.search };
    }
    if (filters.minPrice || filters.maxPrice) {
      filterQuery.unitPrice = {};
      if (filters.minPrice) filterQuery.unitPrice.$gte = filters.minPrice;
      if (filters.maxPrice) filterQuery.unitPrice.$lte = filters.maxPrice;
    }
    if (filters.farmerId) filterQuery.farmerId = filters.farmerId;
    if (filters.organicCertified !== undefined) {
      filterQuery.organicCertified = filters.organicCertified;
    }

    // Filter by state if provided
    if (filters.state) {
      // Need to use aggregation to filter by address state
      const listings = await this.listingModel.aggregate([
        {
          $lookup: {
            from: 'addresses',
            localField: 'farmAddress',
            foreignField: '_id',
            as: 'addressInfo',
          },
        },
        {
          $match: {
            ...filterQuery,
            'addressInfo.state': filters.state,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'farmerId',
            foreignField: '_id',
            as: 'farmerInfo',
            pipeline: [
              {
                $project: { fullName: 1, email: 1, phone: 1, state: 1 },
              },
            ],
          },
        },
        {
          $addFields: {
            farmAddress: { $arrayElemAt: ['$addressInfo', 0] },
            farmerId: { $arrayElemAt: ['$farmerInfo', 0] },
          },
        },
        {
          $sort: {
            [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1,
          },
        },
        {
          $facet: {
            listings: [{ $skip: skip }, { $limit: limit }],
            total: [{ $count: 'count' }],
          },
        },
      ]);

      const result = listings[0];
      const total = result.total[0]?.count || 0;

      return {
        listings: result.listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Build sort query
    const sortQuery: any = {};
    if (query.sortBy) {
      sortQuery[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;
    }

    const [listings, total] = await Promise.all([
      this.listingModel
        .find(filterQuery)
        .populate('farmAddress')
        .populate('farmerId', 'fullName email phone state')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.listingModel.countDocuments(filterQuery).exec(),
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get listings by category for featured sections
  async getListingsByCategory(
    category: string,
    limit: number = 10,
  ): Promise<{ listings: Listing[] }> {
    const listings = await this.listingModel
      .find({
        category,
        status: ListingStatus.ACTIVE,
      })
      .populate('farmAddress')
      .populate('farmerId', 'fullName state')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();

    return { listings };
  }

  // Get popular listings
  async getPopularListings(
    limit: number = 10,
  ): Promise<{ listings: Listing[] }> {
    const listings = await this.listingModel
      .find({ status: ListingStatus.ACTIVE })
      .populate('farmAddress')
      .populate('farmerId', 'fullName state')
      .sort({ viewCount: -1, inquiryCount: -1 })
      .limit(limit)
      .exec();

    return { listings };
  }

  // Get recent listings
  async getRecentListings(
    limit: number = 10,
  ): Promise<{ listings: Listing[] }> {
    const listings = await this.listingModel
      .find({ status: ListingStatus.ACTIVE })
      .populate('farmAddress')
      .populate('farmerId', 'fullName state')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return { listings };
  }

  // Increment inquiry count when someone inquires about a listing
  async incrementInquiryCount(listingId: string): Promise<void> {
    await this.listingModel
      .findByIdAndUpdate(listingId, { $inc: { inquiryCount: 1 } })
      .exec();
  }
}
