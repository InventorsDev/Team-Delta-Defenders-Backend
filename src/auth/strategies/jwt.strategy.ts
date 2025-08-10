import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, UserPayload } from '../../types/global.types';
import { getEnvVar } from '../../common/utils/type.utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getEnvVar('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): UserPayload {
    return {
      userId: payload.sub,
      role: payload.role,
    };
  }
}
