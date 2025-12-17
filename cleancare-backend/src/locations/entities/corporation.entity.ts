import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Zone } from './zone.entity';

@Entity()
export class Corporation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "Dhaka South City Corporation"

  @Column({ unique: true })
  code: string; // e.g., "DSCC"

  @OneToMany(() => Zone, (zone) => zone.corporation)
  zones: Zone[];
}
