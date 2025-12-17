import { Controller, Post, UseGuards, Request, Body, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('firebase-jwt'))
  async login(@Request() req) {
    // req.user contains the decoded firebase token payload returned by Strategy.validate()
    return this.authService.validateUser(req.user);
  }

  @Post('register')
  @UseGuards(AuthGuard('firebase-jwt'))
  async register(@Request() req, @Body() body: any) {
      return this.authService.register(body, req.user);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req) {
      // req.user is populated by JwtStrategy.validate()
      return req.user;
  }
}
