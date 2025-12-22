import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { Calendar } from './entities/calendar.entity';
import { GalleryPost } from './entities/gallery-post.entity';
import { GalleryImage } from './entities/gallery-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmergencyContact, Calendar, GalleryPost, GalleryImage]),
    CloudinaryModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
