import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ComplaintStatus } from '../../common/enums/complaint-status.enum';
import { Ward } from '../../locations/entities/ward.entity';
import { Zone } from '../../locations/entities/zone.entity';
import { Corporation } from '../../locations/entities/corporation.entity';

@Entity()
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  sub_category: string;

  @Column('text')
  description: string;

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.SUBMITTED,
  })
  status: ComplaintStatus;

  // Location
  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  // Relations
  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Location Routing
  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward: Ward;

  @Column({ nullable: true })
  ward_id: string;

  @ManyToOne(() => Zone, { nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @Column({ nullable: true })
  zone_id: string;

  @ManyToOne(() => Corporation, { nullable: true })
  @JoinColumn({ name: 'corporation_id' })
  corporation: Corporation;

  @Column({ nullable: true })
  corporation_id: string;

  // Admin Assignment

  @Column({ nullable: true })
  assigned_admin_id: string;

  // Rating & Solution
  @Column({ type: 'text', nullable: true })
  solution_image: string;

  @Column({ type: 'int', nullable: true })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  review: string;

  @CreateDateColumn({ type: 'timestamptz', nullable: true })
  rated_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
