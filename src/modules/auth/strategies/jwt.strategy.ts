import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurada');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // O que retorna aqui vira req.user — mesmo formato que o GoogleStrategy
  // já usa, pra ficar consistente independente de como o usuário logou.
  async validate(payload: { sub: string; username: string }) {
    return { id_user: payload.sub, email: payload.username };
  }
}
