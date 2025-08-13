import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Address schema for farmer's multiple farm locations
@Schema({ timestamps: true })
export class Address {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  farmerId!: Types.ObjectId;

  @Prop({ required: true })
  addressName!: string; // e.g., "Main Farm", "Secondary Farm"

  @Prop({ required: true })
  streetAddress!: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  postalCode!: string;

  @Prop()
  landmark?: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type AddressDocument = Address & Document;
export const AddressSchema = SchemaFactory.createForClass(Address);

// Product categories enum
export enum ProductCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  GRAINS = 'grains',
  LEGUMES = 'legumes',
  HERBS = 'herbs',
  SPICES = 'spices',
  DAIRY = 'dairy',
  POULTRY = 'poultry',
  LIVESTOCK = 'livestock',
  OTHERS = 'others',
}

// Listing status enum
export enum ListingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

// Unit of measurement enum
export enum UnitOfMeasurement {
  KG = 'kg',
  GRAM = 'gram',
  POUND = 'pound',
  LITRE = 'litre',
  PIECE = 'piece',
  DOZEN = 'dozen',
  BAG = 'bag',
  CRATE = 'crate',
}

// Image sub-schema
@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop()
  alt?: string;

  @Prop({ default: false })
  isPrimary!: boolean; // One image should be primary for display
}

const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// Main listing schema
@Schema({ timestamps: true })
export class Listing {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  farmerId!: Types.ObjectId;

  @Prop({ required: true })
  produceName!: string;

  @Prop({ required: true })
  produceDescription!: string;

  @Prop({ required: true, enum: ProductCategory })
  category!: ProductCategory;

  @Prop({ required: true, min: 0 })
  unitPrice!: number; // Price per unit

  @Prop({ required: true, enum: UnitOfMeasurement })
  unitOfMeasurement!: UnitOfMeasurement;

  @Prop({ min: 0 })
  quantityAvailable?: number; // Available quantity

  @Prop({ min: 0 })
  minimumOrderQuantity?: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Address' })
  farmAddress!: Types.ObjectId; // Reference to farmer's address

  @Prop({ type: [ProductImageSchema], default: [] })
  images!: ProductImage[];

  @Prop({ enum: ListingStatus, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @Prop()
  harvestDate?: Date;

  @Prop()
  expiryDate?: Date;

  @Prop()
  organicCertified?: boolean;

  @Prop([String])
  tags?: string[]; // For search optimization

  @Prop({ default: 0 })
  viewCount!: number;

  @Prop({ default: 0 })
  inquiryCount!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ListingDocument = Listing & Document;
export const ListingSchema = SchemaFactory.createForClass(Listing);

// Add indexes for better query performance
ListingSchema.index({ farmerId: 1 });
ListingSchema.index({ category: 1 });
ListingSchema.index({ status: 1 });
ListingSchema.index({ produceName: 'text', produceDescription: 'text' });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ unitPrice: 1 });

AddressSchema.index({ farmerId: 1 });
AddressSchema.index({ isActive: 1 });
