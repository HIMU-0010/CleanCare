import { Controller, Post, Body, UseGuards, Request, UseInterceptors, UploadedFiles, Get, Param, Patch, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // Use our custom JWT strategy (requires JwtStrategy which we haven't created explicitly yet, or we reuse firebase-jwt if we passed that token. Plan said "Backends return App JWT". So we need JwtStrategy.)
  // Wait, in AuthModule we defined JwtModule but no JwtStrategy. We need to implement JwtStrategy for the standard @UseGuards(AuthGuard('jwt')) to work.
  // For now, let's assume we implement JwtStrategy next or use the verified user from a guard.
  // Actually, Phase 1 Plan said "Issue a custom JWT". So we need a strategy to verify it.
  @UseInterceptors(FilesInterceptor('images', 5)) // Max 5 images
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
  @UseGuards(AuthGuard('jwt'))
  async findAllByWard(@Request() req) {
    // In a real app, strict Role Guard here.
    const wardId = req.user.assigned_ward?.id || req.user.assigned_ward_id;
    return this.complaintsService.findAllByWard(wardId);
  }

  @Get('hierarchy')
  @UseGuards(AuthGuard('jwt'))
  async findByHierarchy(
    @Request() req,
    @Query('corporationId') corporationId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('wardId') wardId?: string,
  ) {
    return this.complaintsService.findByHierarchy(req.user, {
      corporationId,
      zoneId,
      wardId,
    });
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.complaintsService.updateStatus(id, status);
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
