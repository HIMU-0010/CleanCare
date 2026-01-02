import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(payload: any): Promise<any> {
      // JWT Strategy validation
      return { userId: payload.sub, phone: payload.phone, role: payload.role };
  }

  async register(body: any) {
      const { phone, password, role, name, address, wardId, zoneId, corporationId } = body;
      
      if (!phone || !password) throw new BadRequestException('Phone and Password are required');
      
      // Check if already exists
      const existing = await this.usersService.findOneByPhone(phone);
      if (existing) throw new BadRequestException('User already exists');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create with Location
      const newUser = await this.usersService.create({
          phone: phone,
          password: hashedPassword,
          name: name,
          address: address,
          role: role || 'USER',
      });
      
      // Update Residence
      await this.usersService.updateResidence(
          newUser.id,
          wardId,
          zoneId,
          corporationId
      );
      
      // Login immediately
      const payload = { sub: newUser.id, phone: newUser.phone, role: newUser.role };
      return {
          user: newUser,
          accessToken: this.jwtService.sign(payload)
      };
  }
  
  async login(body: any) {
    const { phone, password } = body;
    // Use the comprehensive fetch that includes password
    const user: any = await this.usersService.findUserForLogin(phone);
    
    if (!user) {
       throw new BadRequestException('Invalid credentials');
    }
    
    // Check password if exists (for migrated users, they might not have one)
    if (!user.password) {
        throw new BadRequestException('Please reset your password or login via OTP (not supported yet)');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       throw new BadRequestException('Invalid credentials');
    }
      
    // Generate JWT
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async updateUser(userId: string, data: any) {
    return this.usersService.update(userId, data);
  }

  async updateResidence(userId: string, wardId: string, zoneId: string, corpId: string) {
      return this.usersService.updateResidence(userId, wardId, zoneId, corpId);
  }

  async getUserProfile(userId: string) {
      return this.usersService.findOne(userId);
  }
}
