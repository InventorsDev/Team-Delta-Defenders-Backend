import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ListingController } from './listing.controller';
import { UploadController } from './file-upload.controller';
import { ListingService } from './listing.service';
import { FileUploadService } from './file-upload.service';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { Address, AddressSchema } from './schemas/listing.schema';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Address.name, schema: AddressSchema },
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (_configService: ConfigService) => ({
        storage: multer.diskStorage({
          destination: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, destination: string) => void,
          ) => {
            const uploadPath = './uploads/products';
            // Ensure directory exists
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (
            req: Request,
            file: Express.Multer.File,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
            const extension = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${extension}`);
          },
        }),
        fileFilter: (
          req: Request,
          file: Express.Multer.File,
          cb: (error: Error | null, acceptFile: boolean) => void,
        ) => {
          // Only allow image files
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'), false);
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit per file
          files: 10, // Maximum 10 files
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ListingController, UploadController],
  providers: [ListingService, FileUploadService],
  exports: [ListingService, FileUploadService], // Export services for use in other modules if needed
})
export class ListingModule {}
