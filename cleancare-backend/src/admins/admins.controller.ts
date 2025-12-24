import { Controller, Get, Param, Patch, Body, UseGuards, Request, Post } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../common/enums/role.enum';

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt')) 
  async createAdmin(
    @Request() req,
    @Body() body: { phone: string; role: Role; name: string; wardId?: string; zoneIds?: string[]; corporationId?: string },
  ) {
    return this.adminsService.createAdmin(
        req.user,
        body.phone,
        body.role,
        body.name,
        body.wardId,
        body.zoneIds,
        body.corporationId
    );
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Request() req,
  ) {
    return this.adminsService.updateAdminStatus(id, body.isActive, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req) {
    return this.adminsService.findAllAdmins(req.user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Request() req) {
    return this.adminsService.findAdminById(id, req.user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateAdmin(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; zoneIds?: string[]; wardId?: string },
    @Request() req,
  ) {
    return this.adminsService.updateAdmin(id, body, req.user);
  }
}
