import { Controller, Get, Post, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../common/guards/roles.guard'; // Assuming we have or will genericize this

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('corporations')
  @UseGuards(AuthGuard('jwt'))
  async createCorporation(@Body() body: { name: string; code: string }, @Request() req) {
    if (req.user.role !== 'MASTER_ADMIN') {
        throw new BadRequestException('Only Master Admin can manage locations');
    }
    return this.locationsService.createCorporation(body.name, body.code);
  }

  @Get('corporations')
  async findAllCorporations() {
    return this.locationsService.findAllCorporations();
  }

  @Get('corporations/:id/zones')
  async findZones(@Param('id') id: string) {
      return this.locationsService.findZonesByCorporation(id);
  }

  @Get('corporations/:id/wards')
  async findAllWards(@Param('id') id: string) {
      return this.locationsService.findAllWardsByCorporation(id);
  }

  @Get('zones/:id/wards')
  async findWards(@Param('id') id: string) {
      return this.locationsService.findWardsByZone(id);
  }

  @Post('zones')
  @UseGuards(AuthGuard('jwt'))
  async createZone(@Body() body: { name: string; corporationId: string }, @Request() req) {
    if (req.user.role !== 'MASTER_ADMIN') {
        throw new BadRequestException('Only Master Admin can manage locations');
    }
    return this.locationsService.createZone(body.name, body.corporationId);
  }

  @Post('wards')
  @UseGuards(AuthGuard('jwt'))
  async createWard(@Body() body: { name: string; zoneId: string }, @Request() req) {
    if (req.user.role !== 'MASTER_ADMIN') {
        throw new BadRequestException('Only Master Admin can manage locations');
    }
    return this.locationsService.createWard(body.name, body.zoneId);
  }

  @Post('bulk')
  @UseGuards(AuthGuard('jwt'))
  async createBulk(@Body() body: { name: string; code: string; zones: { name: string; wards: string[] }[] }, @Request() req) {
    if (req.user.role !== 'MASTER_ADMIN') {
        throw new BadRequestException('Only Master Admin can manage locations');
    }
    return this.locationsService.createBulk(body);
  }
}
