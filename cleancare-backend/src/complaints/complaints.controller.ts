import { Controller, Post, Body, UseGuards, Request, UseInterceptors, UploadedFiles, UploadedFile, Get, Param, Patch, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get('debug-latest')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN)
  async getLatestDebug() {
    // Debug endpoint to check DB persistence
    return this.complaintsService.findLatest();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('media', 5)) // Max 5 files (images/videos)
  async create(
    @Request() req,
    @Body() createComplaintDto: CreateComplaintDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.complaintsService.create(createComplaintDto, req.user, files);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req) {
    return this.complaintsService.findAllByUser(req.user);
  }

  @Get('ward')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.WARD_ADMIN, Role.MASTER_ADMIN, Role.SUPER_ADMIN)
  async findAllByWard(@Request() req) {
    // In a real app, strict Role Guard here.
    const wardId = req.user.assigned_ward?.id || req.user.assigned_ward_id;
    return this.complaintsService.findAllByWard(wardId);
  }

  @Get('hierarchy')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.MASTER_ADMIN, Role.SUPER_ADMIN, Role.WARD_ADMIN)
  async findByHierarchy(
    @Request() req,
    @Query('corporationId') corporationId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('wardId') wardId?: string,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.complaintsService.findByHierarchy(req.user, {
      corporationId,
      zoneId,
      wardId,
      category,
      subCategory,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.WARD_ADMIN, Role.SUPER_ADMIN, Role.MASTER_ADMIN)
  @UseInterceptors(FilesInterceptor('resolutionMedia', 5))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('resolutionDescription') resolutionDescription?: string,
    @UploadedFiles() resolutionMedia?: Array<Express.Multer.File>,
  ) {
    return this.complaintsService.updateStatus(id, status, resolutionMedia, resolutionDescription);
  }

  @Patch(':id/rate')
  @UseGuards(AuthGuard('jwt'))
  async rateComplaint(
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
    @Request() req,
  ) {
    return this.complaintsService.rateComplaint(id, body.rating, body.review || '', req.user.id);
  }
}
