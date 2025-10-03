// src/users/dto/update-password.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
