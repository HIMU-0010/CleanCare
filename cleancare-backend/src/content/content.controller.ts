import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Helper for file storage (simplified for local dev)
const storageConfig = {
  storage: diskStorage({
    destination: './uploads/content',
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // --- Public Endpoints ---

  @Get('contacts')
  async getContacts() {
    return this.contentService.getContacts();
  }

  @Get('calendar')
  async getCalendar() {
    return this.contentService.getActiveCalendar();
  }

  @Get('gallery')
  async getGallery() {
    return this.contentService.getGalleryPosts();
  }

  // --- Admin Endpoints (MASTER_ADMIN only) ---

  @Post('contacts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  async createContact(@Body() body: any) {
    return this.contentService.createContact(body);
  }

  @Put('contacts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  async updateContact(@Param('id') id: string, @Body() body: any) {
    return this.contentService.updateContact(id, body);
  }

  @Delete('contacts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  async deleteContact(@Param('id') id: string) {
    return this.contentService.deleteContact(id);
  }

  @Post('calendar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  @UseInterceptors(FileInterceptor('image', storageConfig))
  async uploadCalendar(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    // Assuming file is served statically
    // For production, use cloud storage (S3, Cloudinary)
    // Here we return the local path relative to static serve
    // Note: You need to configure static serving in main.ts
    const imageUrl = `uploads/content/${file.filename}`;
    return this.contentService.uploadCalendar(imageUrl, body.year);
  }

  @Post('gallery')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, storageConfig))
  async createGalleryPost(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    const imageUrls = files.map(file => `uploads/content/${file.filename}`);
    return this.contentService.createGalleryPost(body.title, body.description, imageUrls);
  }

  @Put('gallery/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10, storageConfig))
  async updateGalleryPost(@Param('id') id: string, @UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    const imageUrls = files ? files.map(file => `uploads/content/${file.filename}`) : [];
    return this.contentService.updateGalleryPost(id, body.title, body.description, imageUrls);
  }
}
