import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  COMPLAINT_STATUS_UPDATE = 'COMPLAINT_STATUS_UPDATE',
  NEW_ANNOUNCEMENT = 'NEW_ANNOUNCEMENT',
  EMERGENCY_CONTACT_UPDATE = 'EMERGENCY_CONTACT_UPDATE',
  GALLERY_POST = 'GALLERY_POST',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column('jsonb', { nullable: true })
  data: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  read_at: Date;

  @CreateDateColumn()
  sent_at: Date;
}
