import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class BuyerSignUpDto {
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
  @MinLength(6)
  password!: string;
}
