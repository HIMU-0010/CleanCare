import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Corporation } from './entities/corporation.entity';
import { Zone } from './entities/zone.entity';
import { Ward } from './entities/ward.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Corporation)
    private corporationsRepository: Repository<Corporation>,
    @InjectRepository(Zone)
    private zonesRepository: Repository<Zone>,
    @InjectRepository(Ward)
    private wardsRepository: Repository<Ward>,
  ) {}

  async createCorporation(name: string, code: string) {
    const corp = this.corporationsRepository.create({ name, code });
    return this.corporationsRepository.save(corp);
  }

  async findAllCorporations() {
    return this.corporationsRepository.find({ relations: ['zones', 'zones.wards'] });
  }

  async createZone(name: string, corporationId: string) {
    const zone = this.zonesRepository.create({ name, corporation_id: corporationId });
    return this.zonesRepository.save(zone);
  }

  async createWard(name: string, zoneId: string) {
    const ward = this.wardsRepository.create({ name, zone_id: zoneId });
    return this.wardsRepository.save(ward);
  }

  async verifyZonesInCorporation(zoneIds: string[], corporationId: string): Promise<boolean> {
    const zones = await this.zonesRepository.findByIds(zoneIds);
    if (zones.length !== zoneIds.length) {
        throw new Error('One or more zones not found');
    }
    return zones.every(zone => zone.corporation_id === corporationId);
  }

  async findZonesByCorporation(corporationId: string) {
    return this.zonesRepository.find({ where: { corporation_id: corporationId }, order: { name: 'ASC' } });
  }

  async findWardsByZone(zoneId: string) {
    return this.wardsRepository.find({ where: { zone_id: zoneId }, order: { name: 'ASC' } });
  }

  async findZonesByIds(zoneIds: string[]) {
    if (zoneIds.length === 0) return [];
    return this.zonesRepository.findByIds(zoneIds);
  }

  async findWardById(wardId: string) {
    return this.wardsRepository.findOne({ where: { id: wardId } });
  }

  async createBulk(data: { name: string; code: string; zones: { name: string; wards: string[] }[] }) {
    // 1. Create Corporation
    const corp = this.corporationsRepository.create({ name: data.name, code: data.code });
    const savedCorp = await this.corporationsRepository.save(corp);

    // 2. Create Zones and Wards
    for (const zoneData of data.zones) {
        const zone = this.zonesRepository.create({ 
            name: zoneData.name, 
            corporation_id: savedCorp.id 
        });
        const savedZone = await this.zonesRepository.save(zone);

        if (zoneData.wards && zoneData.wards.length > 0) {
            const wards = zoneData.wards.map(wardName => 
                this.wardsRepository.create({ 
                    name: wardName.startsWith('Ward') ? wardName : `Ward ${wardName}`,
                    zone_id: savedZone.id 
                })
            );
            await this.wardsRepository.save(wards);
        }
    }

    return this.corporationsRepository.findOne({ 
        where: { id: savedCorp.id }, 
        relations: ['zones', 'zones.wards'] 
    });
  }

  async findAllWardsByCorporation(corporationId: string) {
    // Join Corporation -> Zone -> Ward
    const zones = await this.zonesRepository.find({
        where: { corporation_id: corporationId },
        relations: ['wards']
    });

    // Flatten wards
    const allWards: any[] = [];
    zones.forEach(zone => {
        if (zone.wards) {
            zone.wards.forEach(ward => {
                allWards.push({
                    ...ward,
                    zone_id: zone.id // Ensure zone_id is present
                });
            });
        }
    });

    return allWards.sort((a, b) => a.name.localeCompare(b.name));
  }
}
