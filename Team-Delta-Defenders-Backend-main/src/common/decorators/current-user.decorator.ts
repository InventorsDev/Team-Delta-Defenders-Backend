import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserPayload } from '../../types/global.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserPayload;
  },
);
