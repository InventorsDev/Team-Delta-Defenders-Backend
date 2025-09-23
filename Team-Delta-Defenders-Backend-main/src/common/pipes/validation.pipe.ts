import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { type ValidationError } from 'class-validator';

export function createCustomValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (validationErrors: ValidationError[]) => {
      const errors = validationErrors.map((error) => {
        const constraints = error.constraints;
        if (constraints) {
          return Object.values(constraints).join(', ');
        }
        return 'Validation error';
      });

      return new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    },
  });
}
