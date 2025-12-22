import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { ComplaintStatus } from '../common/enums/complaint-status.enum';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintsRepository: Repository<Complaint>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createComplaintDto: CreateComplaintDto, user: User, files: Array<Express.Multer.File>) {
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    // Upload media to Cloudinary
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const result = await this.cloudinaryService.uploadImage(file);
          // Result type is UploadApiResponse. 
          const url = (result as any).secure_url || (result as any).url;
          
          if (url) {
             const isVideo = file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|mov|avi|mkv)$/i);
             if (isVideo) {
                 videoUrls.push(url);
             } else {
                 imageUrls.push(url);
             }
          }
        } catch (error) {
          console.error('Media upload failed', error);
          throw new InternalServerErrorException('Failed to upload media');
        }
      }
    }

    // Determine Location: Custom or User Residence
    let wardId = createComplaintDto.wardId;
    let zoneId = createComplaintDto.zoneId;
    let corpId = createComplaintDto.corporationId;

    if (!wardId || !zoneId || !corpId) {
        // Fallback to user residence if custom location not fully provided
        if (!user.residence_ward_id || !user.residence_zone_id || !user.residence_corporation_id) {
            throw new InternalServerErrorException('User location profile incomplete and no custom location provided.');
        }
        wardId = user.residence_ward_id;
        zoneId = user.residence_zone_id;
        corpId = user.residence_corporation_id;
    }

    const complaint = this.complaintsRepository.create({
      ...createComplaintDto,
      user_id: user.id,
      images: imageUrls,
      videos: videoUrls,
      status: ComplaintStatus.SUBMITTED,
      ward_id: wardId,
      zone_id: zoneId,
      corporation_id: corpId,
    });

    return this.complaintsRepository.save(complaint);
  }

  async findLatest() {
    return this.complaintsRepository.find({
      order: { created_at: 'DESC' },
      take: 1,
    });
  }

  async findAllByUser(user: User) {
    return this.complaintsRepository.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
  }

  async findAllByWard(wardId: string) {
    return this.complaintsRepository.find({
      where: { ward_id: wardId },
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: string, status: string) {
    // Validate status if needed
    // const validStatuses = [ComplaintStatus.SUBMITTED, ComplaintStatus.PROCESSING, ComplaintStatus.SOLVED, ComplaintStatus.REJECTED];
    // if (!validStatuses.includes(status as ComplaintStatus)) throw new BadRequestException('Invalid status');

    await this.complaintsRepository.update(id, { status: status as ComplaintStatus });
    return this.complaintsRepository.findOneBy({ id });
  }

  async rateComplaint(id: string, rating: number, review: string, userId: string) {
    const complaint = await this.complaintsRepository.findOneBy({ id });
    if (!complaint) {
        throw new Error('Complaint not found');
    }
    if (complaint.user_id !== userId) {
        throw new Error('Unauthorized');
    }
    if (complaint.status !== ComplaintStatus.SOLVED) {
        throw new Error('Only solved complaints can be rated');
    }

    complaint.rating = rating;
    complaint.review = review;
    complaint.rated_at = new Date();
    
    return this.complaintsRepository.save(complaint);
  }

  async findByHierarchy(
    user: any,
    filters: { corporationId?: string; zoneId?: string; wardId?: string; category?: string; subCategory?: string }
  ) {
    const { corporationId, zoneId, wardId, category, subCategory } = filters;
    
    const query = this.complaintsRepository.createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.ward', 'ward')
      .leftJoinAndSelect('complaint.zone', 'zone')
      .leftJoinAndSelect('complaint.corporation', 'corporation')
      .orderBy('complaint.created_at', 'DESC');

    // Apply Category Filters (Global for all roles if provided)
    if (category) {
        query.andWhere('complaint.category = :category', { category });
    }
    if (subCategory) {
        query.andWhere('complaint.sub_category = :subCategory', { subCategory });
    }

    // Master Admin can see all, or filter by any level
    if (user.role === 'MASTER_ADMIN') {
      if (wardId) {
        query.andWhere('complaint.ward_id = :wardId', { wardId });
      } else if (zoneId) {
        query.andWhere('complaint.zone_id = :zoneId', { zoneId });
      } else if (corporationId) {
        query.andWhere('complaint.corporation_id = :corporationId', { corporationId });
      }
      // No filter = all complaints
    }
    // Super Admin can only see complaints in their assigned zones
    else if (user.role === 'SUPER_ADMIN') {
      const assignedZoneIds = user.assigned_zones?.map((z: any) => z.id) || [];
      
      if (assignedZoneIds.length === 0) {
        return []; // No zones assigned, no complaints
      }

      // Filter by assigned zones
      if (wardId) {
        // Verify ward is in their zones
        query.andWhere('complaint.ward_id = :wardId', { wardId });
        query.andWhere('complaint.zone_id IN (:...zoneIds)', { zoneIds: assignedZoneIds });
      } else if (zoneId) {
        // Verify zone is in their assigned zones
        if (!assignedZoneIds.includes(zoneId)) {
          throw new BadRequestException('You do not have access to this zone');
        }
        query.andWhere('complaint.zone_id = :zoneId', { zoneId });
      } else {
        // Show all complaints from their zones
        query.andWhere('complaint.zone_id IN (:...zoneIds)', { zoneIds: assignedZoneIds });
      }
    }
    // Ward Admin - existing logic
    else if (user.role === 'WARD_ADMIN') {
      const wardAdminWardId = user.assigned_ward?.id || user.assigned_ward_id;
      if (!wardAdminWardId) {
        return [];
      }
      query.andWhere('complaint.ward_id = :wardId', { wardId: wardAdminWardId });
    }
    else {
      throw new BadRequestException('Unauthorized to view complaints');
    }

    return query.getMany();
  }
}
