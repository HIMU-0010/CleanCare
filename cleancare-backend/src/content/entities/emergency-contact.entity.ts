import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  icon: string; // e.g., 'flame', 'medical'

  @Column({ default: '#FF4500' })
  color: string; // Hex code

  @Column({ default: 0 })
  priority: number; // For sorting

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
