import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword!: string;
}
