import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(firebaseUser: any): Promise<any> {
    const { uid, phone_number } = firebaseUser;
    
    // For Dev User, ensure we have a valid phone
    const phone = phone_number || (uid === 'dev-user-id' ? '+8801700000000' : null);

    if (!phone) {
      throw new BadRequestException('Phone number not found in Firebase token');
    }
    
    let user = await this.usersService.findOneByPhone(phone);

    if (!user) {
        // Stop auto-creation. Return null so controller can send 404 or specific "User Not Found".
        return null;
    }

    // Generate our own JWT
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(body: any, firebaseUser: any) {
      const { phone_number, uid } = firebaseUser;
      const phone = phone_number || (uid === 'dev-user-id' ? '+8801700000000' : null);

      if (!phone) throw new BadRequestException('Invalid Phone');

      // Check if already exists
      const existing = await this.usersService.findOneByPhone(phone);
      if (existing) throw new BadRequestException('User already exists');

      // Create with Location
      const newUser = await this.usersService.create({
          phone: phone,
          name: body.name,
          address: body.address,
          role: body.role, // Default USER
      });

      // Update Residence
      await this.usersService.updateResidence(
          newUser.id,
          body.wardId,
          body.zoneId,
          body.corporationId
      );

      // Login immediately
      const payload = { sub: newUser.id, phone: newUser.phone, role: newUser.role };
      return {
          user: newUser,
          accessToken: this.jwtService.sign(payload)
      };
  }
}
