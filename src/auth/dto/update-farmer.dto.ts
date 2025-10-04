import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateFarmerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  farmAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  businessName!: string;
}
