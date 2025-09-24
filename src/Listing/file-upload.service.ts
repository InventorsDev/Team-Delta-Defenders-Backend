import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {}

  // Multer configuration for image uploads
  getMulterConfig() {
    return {
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
    };
  }

  // Process uploaded files and return file URLs
  processUploadedFiles(files: Express.Multer.File[]): {
    url: string;
    filename: string;
    originalName: string;
  }[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const baseUrl =
      this.configService.get<string>('BASE_URL') ?? 'http://localhost:3000';

    return files.map((file) => ({
      url: `${baseUrl}/uploads/products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
    }));
  }

  // Delete uploaded file
  deleteFile(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join('./uploads/products', filename);

      fs.unlink(filePath, (err) => {
        if (err) {
          // Don't throw error if file doesn't exist
          if (err.code !== 'ENOENT') {
            reject(new InternalServerErrorException('Error deleting file'));
            return;
          }
        }
        resolve();
      });
    });
  }

  // Delete multiple files
  async deleteMultipleFiles(filenames: string[]): Promise<void> {
    const deletePromises = filenames.map((filename) =>
      this.deleteFile(filename),
    );
    await Promise.allSettled(deletePromises);
  }

  // Validate image dimensions (optional)
  validateImageDimensions(
    _filePath: string,
    _minWidth: number = 200,
    _minHeight: number = 200,
  ): boolean {
    try {
      // You can use a library like 'sharp' or 'jimp' for image processing
      // For now, we'll assume basic validation
      return true;
    } catch {
      throw new BadRequestException('Invalid image format');
    }
  }

  // Resize image (optional - requires sharp package)
  async resizeImage(
    _inputPath: string,
    _outputPath: string,
    _width: number,
    _height: number,
  ): Promise<void> {
    // Implementation would use sharp or similar library
    // const sharp = require('sharp');
    // await sharp(inputPath)
    //   .resize(width, height, { fit: 'cover' })
    //   .jpeg({ quality: 80 })
    //   .toFile(outputPath);
  }
}
