import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Zone } from './zone.entity';

@Entity()
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g. "Ward 1"

  @Column()
  zone_id: string;

  @ManyToOne(() => Zone, (zone) => zone.wards)
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}
