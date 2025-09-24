// common/config/config.module.ts
import { Module } from '@nestjs/common';
import { EnvironmentConfig } from './environment.config';

@Module({
  providers: [EnvironmentConfig],
  exports: [EnvironmentConfig],
})
export class ConfigModule {}
