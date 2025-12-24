import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.expo = new Expo();
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
    type: NotificationType = NotificationType.SYSTEM,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user || !user.push_token) {
        this.logger.warn(`User ${userId} does not have a push token registered`);
        return;
      }

      if (!Expo.isExpoPushToken(user.push_token)) {
        this.logger.error(`Push token ${user.push_token} is not a valid Expo push token`);
        await this.removeInvalidToken(userId);
        return;
      }

      await this.sendPushNotification([user.push_token], payload);
      
      // Save notification to database
      await this.saveNotification(userId, payload, type);
      
      this.logger.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    payload: PushNotificationPayload,
    type: NotificationType = NotificationType.SYSTEM,
  ): Promise<void> {
    const users = await this.userRepository.findByIds(userIds);
    const validTokens: string[] = [];
    const userIdsWithTokens: string[] = [];

    for (const user of users) {
      if (user.push_token && Expo.isExpoPushToken(user.push_token)) {
        validTokens.push(user.push_token);
        userIdsWithTokens.push(user.id);
      }
    }

    if (validTokens.length === 0) {
      this.logger.warn('No valid push tokens found for the specified users');
      return;
    }

    try {
      await this.sendPushNotification(validTokens, payload);
      
      // Save notifications to database for all users (even if push failed individually, we want the record)
      // Ideally we check tickets, but for bulk keeping it simple for now
      for (const userId of userIds) {
        await this.saveNotification(userId, payload, type);
      }
      
      this.logger.log(`Push notifications sent to ${validTokens.length} users`);
    } catch (error) {
      this.logger.error('Failed to send multicast notification:', error);
    }
  }

  /**
   * Send push notification to all users in a ward
   */
  async sendToWard(
    wardId: string,
    payload: PushNotificationPayload,
    type: NotificationType = NotificationType.SYSTEM,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: { residence_ward_id: wardId },
    });

    const userIds = users.map(user => user.id);
    await this.sendToMultipleUsers(userIds, payload, type);
  }

  /**
   * Register or update user's push token
   */
  async registerToken(userId: string, token: string): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error('Invalid Expo push token');
    }

    await this.userRepository.update(userId, {
      push_token: token,
      push_token_updated_at: new Date(),
    });
    
    this.logger.log(`Push token registered for user ${userId}`);
  }

  /**
   * Remove user's push token
   */
  async removeToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      push_token: null as any,
      push_token_updated_at: null as any,
    });
    
    this.logger.log(`Push token removed for user ${userId}`);
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(userId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { sent_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user_id: userId },
      { read: true, read_at: new Date() },
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user_id: userId, read: false },
      { read: true, read_at: new Date() },
    );
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user_id: userId, read: false },
    });
  }

  // Private helper methods

  private async sendPushNotification(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<void> {
    const messages: ExpoPushMessage[] = [];

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        this.logger.warn(`Skipping invalid token: ${token}`);
        continue;
      }

      messages.push({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: 'high',
        channelId: 'default',
        badge: 1, 
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending chunks', error);
      }
    }
    
    // Optional: handle tickets to check for errors like DeviceNotRegistered
    // and cleanup invalid tokens.
    this.handleTickets(tickets);
  }
  
  private async handleTickets(tickets: ExpoPushTicket[]) {
      for (const ticket of tickets) {
          if (ticket.status === 'error') {
              this.logger.error(`Error sending notification: ${ticket.message}`);
              if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                  //Ideally clean up token here if we knew which user it belonged to
                  // For now, logging.
              }
          }
      }
  }

  private async saveNotification(
    userId: string,
    payload: PushNotificationPayload,
    type: NotificationType,
  ): Promise<void> {
    const notification = this.notificationRepository.create({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      type,
    });

    await this.notificationRepository.save(notification);
  }

  private async removeInvalidToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      push_token: null as any,
      push_token_updated_at: null as any,
    });
    
    this.logger.log(`Removed invalid push token for user ${userId}`);
  }

  // Notification templates

  async sendComplaintStatusUpdate(
    userId: string,
    complaintId: string,
    newStatus: string,
    complaintCategory: string,
  ): Promise<void> {
    const statusMessages = {
      PROCESSING: 'Your complaint is now being addressed',
      SOLVED: 'Your complaint has been resolved',
      REJECTED: 'Your complaint has been reviewed',
    };

    const payload: PushNotificationPayload = {
      title: 'Complaint Status Updated',
      body: statusMessages[newStatus] || `Your complaint status changed to ${newStatus}`,
      data: {
        type: 'complaint_status_update',
        complaintId,
        status: newStatus,
        category: complaintCategory,
      },
    };

    await this.sendToUser(userId, payload, NotificationType.COMPLAINT_STATUS_UPDATE);
  }

  async sendNewAnnouncement(title: string, message: string): Promise<void> {
    // Send to all active users
    const users = await this.userRepository.find({
      where: { is_active: true },
    });

    const userIds = users.map(user => user.id);
    
    const payload: PushNotificationPayload = {
      title: `📢 ${title}`,
      body: message,
      data: {
        type: 'announcement',
      },
    };

    await this.sendToMultipleUsers(userIds, payload, NotificationType.NEW_ANNOUNCEMENT);
  }

  async sendNewComplaintNotification(complaint: any): Promise<void> {
    const adminIds = new Set<string>();

    // 1. Find Ward Admins for this ward
    const wardAdmins = await this.userRepository.find({
      where: {
        role: Role.WARD_ADMIN,
        assigned_ward_id: complaint.ward_id,
      },
    });
    wardAdmins.forEach(admin => adminIds.add(admin.id));

    // 2. Find Super Admins for this zone (using QueryBuilder for ManyToMany)
    const superAdmins = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.assigned_zones', 'zone')
      .where('user.role = :role', { role: Role.SUPER_ADMIN })
      .andWhere('zone.id = :zoneId', { zoneId: complaint.zone_id })
      .getMany();
    superAdmins.forEach(admin => adminIds.add(admin.id));

    // 3. Find Master Admins (All)
    const masterAdmins = await this.userRepository.find({
      where: { role: Role.MASTER_ADMIN },
    });
    masterAdmins.forEach(admin => adminIds.add(admin.id));

    if (adminIds.size === 0) return;

    const payload: PushNotificationPayload = {
      title: 'New Complaint Submitted',
      body: `A new complaint has been reported in Ward ${complaint.ward?.name || 'Unknown'}`,
      data: {
        type: 'new_complaint',
        complaintId: complaint.id,
        category: complaint.category,
      },
    };

    await this.sendToMultipleUsers(Array.from(adminIds), payload, NotificationType.SYSTEM);
  }
}
