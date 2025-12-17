import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { Complaint } from './entities/complaint.entity';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service'; // Ensure Service is available if not exported by Module properly (it is)
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint]),
    CloudinaryModule,
    UsersModule,
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
