import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProductCategory,
  ListingStatus,
  UnitOfMeasurement,
} from '../schemas/listing.schema';

// Address DTOs
export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  addressName!: string;

  @IsString()
  @IsNotEmpty()
  streetAddress!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @IsString()
  @IsOptional()
  landmark?: string;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  addressName?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Product Image DTO
export class ProductImageDto {
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// Listing DTOs
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  produceName!: string;

  @IsString()
  @IsNotEmpty()
  produceDescription!: string;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsEnum(UnitOfMeasurement)
  unitOfMeasurement!: UnitOfMeasurement;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityAvailable?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumOrderQuantity?: number;

  @IsMongoId()
  farmAddress!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @ArrayMinSize(1, { message: 'At least one image is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  images!: ProductImageDto[];

  @IsDateString()
  @IsOptional()
  harvestDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsBoolean()
  @IsOptional()
  organicCertified?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateListingDto {
  @IsString()
  @IsOptional()
  produceName?: string;

  @IsString()
  @IsOptional()
  produceDescription?: string;

  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsEnum(UnitOfMeasurement)
  @IsOptional()
  unitOfMeasurement?: UnitOfMeasurement;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityAvailable?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  minimumOrderQuantity?: number;

  @IsMongoId()
  @IsOptional()
  farmAddress?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @ArrayMaxSize(10, { message: 'Maximum 10 images allowed' })
  @IsOptional()
  images?: ProductImageDto[];

  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @IsDateString()
  @IsOptional()
  harvestDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsBoolean()
  @IsOptional()
  organicCertified?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Query DTOs for filtering and pagination
export class ListingQueryDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @IsString()
  @IsOptional()
  search?: string; // For text search in produceName and description

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsMongoId()
  @IsOptional()
  farmerId?: string; // To filter by specific farmer

  @IsString()
  @IsOptional()
  state?: string; // To filter by state

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  organicCertified?: boolean;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt'; // createdAt, unitPrice, viewCount

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FarmerListingQueryDto extends ListingQueryDto {
  // Farmers can see all their listings including inactive ones
  @IsEnum(ListingStatus)
  @IsOptional()
  declare status?: ListingStatus; // Override to allow all statuses
}
