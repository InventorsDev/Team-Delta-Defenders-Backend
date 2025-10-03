import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/schema/user.schema';

export class SwitchRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

// For creating additional farmer role
export class CreateFarmerRoleDto {
  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  farmAddress!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  // Allow updating of general fields during role creation
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

// For creating additional buyer role
export class CreateBuyerRoleDto {
  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsString()
  houseAddress!: string;

  // Allow updating of general fields during role creation
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
