import { Injectable } from '@nestjs/common';
import { EnvironmentVariables } from '../../types/global.types';
import { getEnvVar } from '../utils/type.utils';

@Injectable()
export class EnvironmentConfig {
  private readonly envVars: EnvironmentVariables;

  constructor() {
    this.envVars = {
      JWT_SECRET: getEnvVar('JWT_SECRET'),
      EMAIL_USER: getEnvVar('EMAIL_USER'),
      EMAIL_PASS: getEnvVar('EMAIL_PASS'),
      FRONTEND_URL: getEnvVar('FRONTEND_URL'),
      DATABASE_URL: getEnvVar('DATABASE_URL'),
      PORT: getEnvVar('PORT', '5000'), // Default to 5000 if PORT is not set
    };
  }

  get jwtSecret(): string {
    return this.envVars.JWT_SECRET;
  }

  get emailUser(): string {
    return this.envVars.EMAIL_USER;
  }

  get emailPass(): string {
    return this.envVars.EMAIL_PASS;
  }

  get frontendUrl(): string {
    return this.envVars.FRONTEND_URL;
  }

  get databaseUrl(): string {
    return this.envVars.DATABASE_URL;
  }

  get port(): number {
    return parseInt(this.envVars.PORT || '5000', 10);
  }
}
