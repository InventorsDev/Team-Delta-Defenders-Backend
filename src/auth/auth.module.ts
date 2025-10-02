import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EnvironmentConfig } from '../common/config/environment.config';
import { ConfigModule } from '../common/config/config.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (envConfig: EnvironmentConfig) => ({
        secret: envConfig.jwtSecret,
        signOptions: { expiresIn: '24h' },
      }),
      inject: [EnvironmentConfig],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule {}
