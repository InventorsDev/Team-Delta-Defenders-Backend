import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';
import { FileUploadService } from './file-upload.service';
import type { UserPayload, ApiResponse } from '../types/global.types';

@Controller('uploads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.FARMER) // Only farmers can upload images
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('product-images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Allow up to 10 files
  @HttpCode(HttpStatus.CREATED)
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() _user: UserPayload,
  ): Promise<ApiResponse> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const processedFiles = this.fileUploadService.processUploadedFiles(files);

      return {
        message: 'Images uploaded successfully',
        data: {
          images: processedFiles.map((file, index) => ({
            url: file.url,
            filename: file.filename,
            alt: `Product image ${index + 1}`,
            isPrimary: index === 0, // First image is primary by default
          })),
        },
      };
    } catch (error) {
      // Clean up uploaded files if processing fails
      const filenames = files.map((file) => file.filename);
      await this.fileUploadService.deleteMultipleFiles(filenames);
      throw error;
    }
  }

  @Delete('product-images/:filename')
  @HttpCode(HttpStatus.OK)
  async deleteProductImage(
    @Param('filename') filename: string,
    @CurrentUser() _user: UserPayload,
  ): Promise<ApiResponse> {
    try {
      await this.fileUploadService.deleteFile(filename);
      return { message: 'Image deleted successfully' };
    } catch {
      throw new BadRequestException('Failed to delete image');
    }
  }
}
