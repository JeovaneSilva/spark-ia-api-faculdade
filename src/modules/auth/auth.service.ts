import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDTO } from './DTOs/login.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private repo: AuthRepository,
    private jwtService: JwtService,
  ) {}

  private async generateToken(user: { id_user: string; email: string }) {
    const payload = { sub: user.id_user, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signIn(data: LoginDTO) {
    const user = await this.repo.signIn(data.email);
    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(data.password, user.password))
    ) {
      throw new UnauthorizedException();
    }
    return this.generateToken(user);
  }

  async loginWithGoogle(user: { id_user: string; email: string }) {
    return this.generateToken(user);
  }
}
