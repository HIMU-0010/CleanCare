import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/locations.service';

@Injectable()
export class AdminsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly locationsService: LocationsService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createAdmin(
    creator: User,
    phone: string,
    role: Role,
    name: string,
    assignedWardId?: string,
    assignedZoneIds?: string[],
    assignedCorporationId?: string,
  ) {
    // 1. Permission Check: ONLY MASTER_ADMIN can create admins
    if (creator.role !== Role.MASTER_ADMIN) {
        throw new BadRequestException('Only Master Admins can create admins');
    }

    if (role === Role.SUPER_ADMIN) {
        if (!assignedCorporationId) {
            throw new BadRequestException('Super Admins must be assigned to a Corporation');
        }
        // Strict Consistency Check: Zones MUST belong to the Corporation
        if (assignedZoneIds && assignedZoneIds.length > 0) {
            const isValid = await this.locationsService.verifyZonesInCorporation(assignedZoneIds, assignedCorporationId);
            if (!isValid) {
                throw new BadRequestException('One or more zones do not belong to the assigned Corporation');
            }
        }
    }

    if (role === Role.WARD_ADMIN && !assignedWardId) {
        throw new BadRequestException('Ward Admins must be assigned to a Ward');
    }

    // 2. Already Exists Check
    const existingUser = await this.usersService.findOneByPhone(phone);
    if (existingUser) {
        throw new ConflictException('User with this phone already exists');
    }

    // 3. Create User with Relations
    const newUser = await this.usersService.create({ phone, role, name });

    // 4. Update Relations via UsersService
    return this.usersService.updateAdminRelations(
        newUser.id, 
        assignedWardId, 
        assignedZoneIds, 
        assignedCorporationId
    );
  }

  async updateAdminStatus(adminId: string, isActive: boolean, currentUser: User) {
    // 1. Strict Permission Check: Only MASTER_ADMIN can block/unblock
    if (currentUser.role !== Role.MASTER_ADMIN) {
        throw new BadRequestException('Only Master Admins can manage admin status');
    }

    const targetUser = await this.usersRepository.findOne({ where: { id: adminId } });
    if (!targetUser) {
        throw new BadRequestException('Admin not found');
    }

    // Prevent blocking Master Admin
    if (targetUser.role === Role.MASTER_ADMIN) {
        throw new BadRequestException('Cannot change status of Master Admin');
    }

    targetUser.is_active = isActive;
    await this.usersRepository.save(targetUser);

    return { message: `Admin ${isActive ? 'unblocked' : 'blocked'} successfully`, userId: adminId, is_active: isActive };
  }

  async findAllAdmins(currentUser: User) {
    if (currentUser.role === Role.MASTER_ADMIN) {
        // Master Admin sees ALL admins (Super and Ward)
        return this.usersRepository.find({
            where: [
                { role: Role.SUPER_ADMIN },
                { role: Role.WARD_ADMIN }
            ],
            relations: [
              'assigned_corporation', 
              'assigned_ward', 
              'assigned_ward.zone',
              'assigned_ward.zone.corporation',
              'assigned_zones'
            ],
            order: { created_at: 'DESC' }
        });
    }

    if (currentUser.role === Role.SUPER_ADMIN) {
        // Get Super Admin's Zones
        const superAdmin = await this.usersRepository.findOne({
            where: { id: currentUser.id },
            relations: ['assigned_zones', 'assigned_corporation']
        });

        if (!superAdmin) {
            throw new BadRequestException('Super Admin not found');
        }

        if (!superAdmin.assigned_zones || superAdmin.assigned_zones.length === 0) {
            return [];
        }

        const zoneIds = superAdmin.assigned_zones.map(z => z.id);

        // Find Ward Admins whose Ward belongs to these Zones
        return this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.assigned_ward', 'ward')
            .leftJoinAndSelect('ward.zone', 'zone')
            .leftJoinAndSelect('zone.corporation', 'corporation')
            .where('user.role = :role', { role: Role.WARD_ADMIN })
            .andWhere('ward.zone_id IN (:...zoneIds)', { zoneIds })
            .getMany();
    }

    throw new BadRequestException('Unauthorized to list admins');
  }

  async findAdminById(adminId: string, currentUser: User) {
    const admin = await this.usersRepository.findOne({
      where: { id: adminId },
      relations: [
        'assigned_corporation', 
        'assigned_ward', 
        'assigned_ward.zone',
        'assigned_ward.zone.corporation',
        'assigned_zones'
      ]
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    // Permission: Master Admin can view all, Super Admin can only view Ward Admins in their zones
    if (currentUser.role === Role.MASTER_ADMIN) {
      return admin;
    }

    if (currentUser.role === Role.SUPER_ADMIN) {
      if (admin.role !== Role.WARD_ADMIN) {
        throw new BadRequestException('You can only view Ward Admins');
      }
      // Optional: Check if Ward Admin is in Super Admin's zones
      return admin;
    }

    throw new BadRequestException('Unauthorized to view this admin');
  }

  async updateAdmin(
    adminId: string, 
    updateData: { name?: string; phone?: string; zoneIds?: string[]; wardId?: string }, 
    currentUser: User
  ) {
    // Only MASTER_ADMIN can update admins
    if (currentUser.role !== Role.MASTER_ADMIN) {
      throw new BadRequestException('Only Master Admins can update admin information');
    }

    const admin = await this.usersRepository.findOne({ 
      where: { id: adminId },
      relations: ['assigned_zones', 'assigned_ward']
    });
    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    if (updateData.name) {
      admin.name = updateData.name;
    }

    if (updateData.phone) {
      // Check if phone is already in use by another user
      const existingUser = await this.usersService.findOneByPhone(updateData.phone);
      if (existingUser && existingUser.id !== adminId) {
        throw new BadRequestException('Phone number is already in use');
      }
      admin.phone = updateData.phone;
    }

    // Update zones for Super Admin
    if (updateData.zoneIds !== undefined && admin.role === Role.SUPER_ADMIN) {
      if (updateData.zoneIds.length > 0) {
        const zones = await this.locationsService.findZonesByIds(updateData.zoneIds);
        admin.assigned_zones = zones;
      } else {
        admin.assigned_zones = [];
      }
    }

    // Update ward for Ward Admin
    if (updateData.wardId !== undefined && admin.role === Role.WARD_ADMIN) {
      const ward = await this.locationsService.findWardById(updateData.wardId);
      if (!ward) {
        throw new BadRequestException('Ward not found');
      }
      admin.assigned_ward = ward;
    }

    await this.usersRepository.save(admin);
    return admin;
  }
}
