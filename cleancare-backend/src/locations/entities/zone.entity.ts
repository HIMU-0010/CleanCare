import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Corporation } from './corporation.entity';
import { Ward } from './ward.entity';

@Entity()
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "Zone 1"

  @Column()
  corporation_id: string;

  @ManyToOne(() => Corporation, (corporation) => corporation.zones)
  @JoinColumn({ name: 'corporation_id' })
  corporation: Corporation;

  @OneToMany(() => Ward, (ward) => ward.zone)
  wards: Ward[];
}
