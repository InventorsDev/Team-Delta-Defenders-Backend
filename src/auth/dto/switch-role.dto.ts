import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class SwitchRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

export class CreateAdditionalRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsNotEmpty()
  password!: string;
}

// For farmer role creation
export class CreateFarmerRoleDto extends CreateAdditionalRoleDto {
  @IsNotEmpty()
  farmAddress!: string;

  cropTypes?: string[];
  businessName?: string;
}

// For buyer role creation - can be extended with buyer-specific fields
export class CreateBuyerRoleDto extends CreateAdditionalRoleDto {
  houseAddress?: string;
  businessType?: string;
}
