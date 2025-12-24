import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { ComplaintStatus } from '../common/enums/complaint-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintsRepository: Repository<Complaint>,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
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

    const savedComplaint = await this.complaintsRepository.save(complaint);

    // Fetch full complaint with relations to send notification
    try {
        const fullComplaint = await this.complaintsRepository.findOne({
            where: { id: savedComplaint.id },
            relations: ['ward', 'zone', 'corporation'],
        });
        
        if (fullComplaint) {
            await this.notificationsService.sendNewComplaintNotification(fullComplaint);
        }
    } catch (error) {
        console.error('Failed to send admin notification', error);
    }

    return savedComplaint;
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
      relations: ['ward', 'corporation', 'zone'],
    });
  }

  async findAllByWard(wardId: string) {
    return this.complaintsRepository.find({
      where: { ward_id: wardId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const complaint = await this.complaintsRepository.findOne({
      where: { id },
      relations: ['ward', 'corporation', 'zone'],
    });
    if (!complaint) {
      throw new BadRequestException('Complaint not found');
    }
    return complaint;
  }

  async updateStatus(
    id: string, 
    status: string, 
    resolutionMedia?: Array<Express.Multer.File>,
    resolutionDescription?: string
  ) {
    // Check if complaint exists and get its current status
    const complaint = await this.complaintsRepository.findOneBy({ id });
    if (!complaint) {
      throw new BadRequestException('Complaint not found');
    }

    // Prevent changing status if complaint is already SOLVED or REJECTED
    if (complaint.status === ComplaintStatus.SOLVED || complaint.status === ComplaintStatus.REJECTED) {
      throw new BadRequestException(`Cannot change status of ${complaint.status.toLowerCase()} complaints`);
    }

    // Validate that SOLVED status requires at least one resolution media file
    if (status === ComplaintStatus.SOLVED && (!resolutionMedia || resolutionMedia.length === 0)) {
      throw new BadRequestException('At least one resolution image or video is required when marking complaint as SOLVED');
    }

    // Validate that REJECTED status requires a rejection description
    if (status === ComplaintStatus.REJECTED && !resolutionDescription) {
      throw new BadRequestException('A rejection description is required when marking complaint as REJECTED');
    }

    const updateData: Partial<Complaint> = { 
      status: status as ComplaintStatus 
    };

    // Upload resolution media to Cloudinary if provided
    if (resolutionMedia && resolutionMedia.length > 0) {
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      for (const file of resolutionMedia) {
        try {
          const result = await this.cloudinaryService.uploadImage(file);
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
          console.error('Resolution media upload failed', error);
          throw new InternalServerErrorException('Failed to upload resolution media');
        }
      }

      updateData.resolutionImages = imageUrls;
      updateData.resolutionVideos = videoUrls;
    }

    // Add resolution description if provided
    if (resolutionDescription) {
      updateData.resolutionDescription = resolutionDescription;
    }

    await this.complaintsRepository.update(id, updateData);
    const updatedComplaint = await this.complaintsRepository.findOneBy({ id });
    
    // Send push notification to complaint owner
    if (updatedComplaint && (status === ComplaintStatus.PROCESSING || status === ComplaintStatus.SOLVED || status === ComplaintStatus.REJECTED)) {
      try {
        await this.notificationsService.sendComplaintStatusUpdate(
          updatedComplaint.user_id,
          updatedComplaint.id,
          status,
          updatedComplaint.category,
        );
      } catch (error) {
        // Log error but don't fail the status update
        console.error('Failed to send notification:', error);
      }
    }
    
    return updatedComplaint;
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
