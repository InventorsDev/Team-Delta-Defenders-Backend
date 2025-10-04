import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class FarmerSignUpDto {
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  state!: string;

  @IsNotEmpty()
  @IsString()
  farmAddress!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}
