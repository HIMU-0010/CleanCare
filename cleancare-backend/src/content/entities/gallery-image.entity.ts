import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GalleryPost } from './gallery-post.entity';

@Entity()
export class GalleryImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imageUrl: string;

  @ManyToOne(() => GalleryPost, post => post.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: GalleryPost;

  @Column()
  postId: string;
}
