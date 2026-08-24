import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor( private userService: UsersService) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;


  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error('Variáveis de ambiente do Google OAuth não configuradas');
  }

  super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });
}

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    try{
        const user = await this.userService.findOrCreateFromGoogle(email, name);
        done(null, user);
    } catch (error) {
        done(error, false);
    }
    
}}