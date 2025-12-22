import { Controller, Post, UseGuards, Request, Body, Get, Patch } from '@nestjs/common';
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

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Request() req, @Body() body: any) {
    const userId = req.user.id;
    
    // Update basic info
    if (body.name || body.address || body.email) {
        await this.authService.updateUser(userId, {
            name: body.name,
            address: body.address,
            email: body.email
        });
    }

    // Update location if provided
    if (body.wardId || body.zoneId || body.corporationId) {
         // This might require a usersService method if authService doesn't expose it directly, 
         // but we can add a wrapper in AuthService or access UsersService if public (it is private in AuthController constructor).
         // Wait, AuthService constructor injects UsersService. AuthController injects AuthService.
         // Effectively we need to expose update in AuthService or make UsersService public/inject it here.
         // Let's check AuthController constructor.
         // It only has AuthService.
         // So I should add `updateUser` to AuthService.
         await this.authService.updateResidence(userId, body.wardId, body.zoneId, body.corporationId);
    }
    
    // Return updated profile
    return this.authService.getUserProfile(userId);
  }
}
