import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
<<<<<<< HEAD
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
    origin: envConfig.frontendUrl,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = envConfig.port;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
=======

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
await app.listen(3000);
console.log('App is running on http://localhost:3000');
}
bootstrap();
>>>>>>> 83c413f657eb2717b3f8d8936d913c3092d5a736
