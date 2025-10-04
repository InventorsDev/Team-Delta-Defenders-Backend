import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createCustomValidationPipe } from './common/pipes/validation.pipe';
import { EnvironmentConfig } from './common/config/environment.config';
import { config } from 'dotenv';
import type { NestExpressApplication } from '@nestjs/platform-express'; // Changed to import type
import { join } from 'path';

// Load environment variables from .env file
config({ path: '.env' });
console.log('Environment Variables:', {
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get environment config
  const envConfig = app.get(EnvironmentConfig);

  // Global middleware and filters
  app.useGlobalPipes(createCustomValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // CORS configuration
  app.enableCors({
    origin: [
      'https://agrilink-delta-defenders.vercel.app/',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  //Use Render PORT if available
  const port = process.env.PORT || envConfig.port || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
