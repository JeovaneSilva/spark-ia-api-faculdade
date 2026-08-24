import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDTO } from './DTOs/login.dto.js';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto:LoginDTO) {
    return this.authService.signIn(signInDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req: Request & { user: { id_user: string; email: string } }){
    return this.authService.loginWithGoogle(req.user as {id_user:string,email: string});
  }
}
