// src/users/dto/update-settings.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}
