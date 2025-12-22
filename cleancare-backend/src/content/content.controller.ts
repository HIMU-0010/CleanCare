import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, UploadedFile, BadRequestException } from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';



@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
  @UseInterceptors(FileInterceptor('image'))
  async uploadCalendar(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) throw new BadRequestException('Image file is required');
    const result = await this.cloudinaryService.uploadImage(file);
    // Determine the URL property based on result type
    const imageUrl = (result as any).secure_url || (result as any).url;
    return this.contentService.uploadCalendar(imageUrl, body.year);
  }

  @Post('gallery')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async createGalleryPost(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    const featureImageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await this.cloudinaryService.uploadImage(file);
        featureImageUrls.push((result as any).secure_url || (result as any).url);
      }
    }

    return this.contentService.createGalleryPost(body.title, body.description, featureImageUrls);
  }

  @Put('gallery/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateGalleryPost(@Param('id') id: string, @UploadedFiles() files: Array<Express.Multer.File>, @Body() body: any) {
    const newImageUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
         const result = await this.cloudinaryService.uploadImage(file);
         newImageUrls.push((result as any).secure_url || (result as any).url);
      }
    }

    return this.contentService.updateGalleryPost(id, body.title, body.description, newImageUrls);
  }
}
