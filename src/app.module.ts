import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { EnvironmentConfig } from './common/config/environment.config';
import { getEnvVar } from './common/utils/type.utils';
import { ListingModule } from './Listing/listing.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationsModule } from './conversations/conversation.module';



@Module({
  imports: [
     MessagesModule,
     ConversationsModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      
    }),
    MongooseModule.forRoot(
      getEnvVar('DATABASE_URL', 'mongodb://localhost:27017/agrilink'),
    ),
    AuthModule,
    ListingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EnvironmentConfig,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
