import { IsOptional, IsString } from 'class-validator';

export class UpdateBuyerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  state?: string;
}
