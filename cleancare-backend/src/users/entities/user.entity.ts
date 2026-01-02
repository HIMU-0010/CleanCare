import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Ward } from '../../locations/entities/ward.entity';
import { Zone } from '../../locations/entities/zone.entity';
import { Corporation } from '../../locations/entities/corporation.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ nullable: true })
  avatar_url: string;

  // New Hierarchy Relations
  
  // For Ward Admins: Manage ONE Ward
  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'assigned_ward_id' })
  assigned_ward: Ward;

  @Column({ nullable: true })
  assigned_ward_id: string;

  // For Super Admins: Belong to ONE Corporation
  @ManyToOne(() => Corporation, { nullable: true })
  @JoinColumn({ name: 'assigned_corporation_id' })
  assigned_corporation: Corporation;

  @Column({ nullable: true })
  assigned_corporation_id: string;

  // For Super Admins: Manage MULTIPLE Zones (Must be within the Corporation)
  @ManyToMany(() => Zone)
  @JoinTable({
    name: 'superadmin_assigned_zones',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'zone_id', referencedColumnName: 'id' },
  })
  assigned_zones: Zone[];

  // Residence Location (For Citizens & Admins)
  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'residence_ward_id' })
  residence_ward: Ward;

  @Column({ nullable: true })
  residence_ward_id: string;

  @ManyToOne(() => Zone, { nullable: true })
  @JoinColumn({ name: 'residence_zone_id' })
  residence_zone: Zone;

  @Column({ nullable: true })
  residence_zone_id: string;

  @ManyToOne(() => Corporation, { nullable: true })
  @JoinColumn({ name: 'residence_corporation_id' })
  residence_corporation: Corporation;

  @Column({ nullable: true })
  residence_corporation_id: string;

  @Column({ nullable: true })
  push_token: string;

  @Column({ nullable: true })
  push_token_updated_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
