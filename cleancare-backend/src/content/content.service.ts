import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { Calendar } from './entities/calendar.entity';
import { GalleryPost } from './entities/gallery-post.entity';
import { GalleryImage } from './entities/gallery-image.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(EmergencyContact)
    private contactsRepo: Repository<EmergencyContact>,
    @InjectRepository(Calendar)
    private calendarRepo: Repository<Calendar>,
    @InjectRepository(GalleryPost)
    private galleryRepo: Repository<GalleryPost>,
  ) {}

  // --- Emergency Contacts ---
  async getContacts() {
    return this.contactsRepo.find({ order: { priority: 'DESC', title: 'ASC' } });
  }

  async createContact(data: Partial<EmergencyContact>) {
    const contact = this.contactsRepo.create(data);
    return this.contactsRepo.save(contact);
  }

  async updateContact(id: string, data: Partial<EmergencyContact>) {
    await this.contactsRepo.update(id, data);
    return this.contactsRepo.findOneBy({ id });
  }

  async deleteContact(id: string) {
    return this.contactsRepo.delete(id);
  }

  // --- Calendar ---
  async getActiveCalendar() {
    return this.calendarRepo.findOne({ where: { isActive: true }, order: { created_at: 'DESC' } });
  }

  async uploadCalendar(imageUrl: string, year: string) {
    // Deactivate previous calendars
    await this.calendarRepo.update({ isActive: true }, { isActive: false });
    
    const calendar = this.calendarRepo.create({ imageUrl, year, isActive: true });
    return this.calendarRepo.save(calendar);
  }

  async deleteCalendar(id: string) {
    return this.calendarRepo.delete(id);
  }

  // --- Gallery ---
  async getGalleryPosts() {
    return this.galleryRepo.find({ order: { date: 'DESC' } });
  }

  async createGalleryPost(title: string, description: string, imageUrls: string[]) {
    const post = this.galleryRepo.create({
      title,
      description,
      images: imageUrls.map(url => ({ imageUrl: url })),
    });
    return this.galleryRepo.save(post);
  }

  async updateGalleryPost(id: string, title: string, description: string, newImageUrls: string[]) {
    const post = await this.galleryRepo.findOne({ where: { id }, relations: ['images'] });
    if (!post) throw new NotFoundException('Post not found');

    post.title = title;
    post.description = description;

    // Append new images if any
    if (newImageUrls && newImageUrls.length > 0) {
        const newImages = newImageUrls.map(url => ({ imageUrl: url }));
        // Depending on cascade settings, simply pushing might work, but let's be explicit
        // The entity has cascade: true, handled by TypeORM
        post.images.push(...newImages as any); 
    }

    return this.galleryRepo.save(post);
  }

  async deleteGalleryPost(id: string) {
    return this.galleryRepo.delete(id);
  }
}
