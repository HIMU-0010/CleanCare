import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  async create(createUserDto: any): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    // Force cast if linter thinks it might be array
    return this.usersRepository.save(user as unknown as User);
  }

  async updateAdminRelations(userId: string, wardId?: string, zoneIds?: string[], corporationId?: string) {
    const user = await this.usersRepository.findOne({ 
        where: { id: userId },
        relations: ['assigned_zones']
    });
    
    if (!user) {
        throw new Error('User not found');
    }

    if (wardId) user.assigned_ward_id = wardId;
    if (corporationId) user.assigned_corporation_id = corporationId;
    
    if (zoneIds && zoneIds.length > 0) {
        user.assigned_zones = zoneIds.map(id => ({ id } as any));
    }
    
    return this.usersRepository.save(user);
  }


  async updateResidence(userId: string, wardId: string, zoneId: string, corporationId: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      // Relations expected to be IDs in update, or entities. 
      // User entity has `residence_ward_id` (number), `residence_zone_id` (uuid), `residence_corporation_id` (uuid).
      
      // Let's verify types. Ward ID is number.
      await this.usersRepository.update(userId, {
          residence_ward_id: wardId,
          residence_zone_id: zoneId,
          residence_corporation_id: corporationId
      });
      
      return this.findOne(userId);
  }

  findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
        where: { id },
        relations: ['assigned_ward', 'assigned_corporation', 'assigned_zones', 'assigned_zones.wards'] 
    });
  }
}
