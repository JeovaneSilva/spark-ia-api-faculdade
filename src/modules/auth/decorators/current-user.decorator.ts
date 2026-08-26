import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  id_user: string;
  email: string;
}

// Lê req.user (preenchido pela JwtStrategy/GoogleStrategy) e injeta direto
// no parâmetro do controller — evita repetir @Req() + cast em toda rota.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
