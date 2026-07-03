import { Notification } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { INotificationRepository, CreateNotificationDto, UpdateNotificationDto } from '../../domain/notification/notification.repository';

/**
 * Prisma-backed implementation of the Notification repository.
 */
export class NotificationRepositoryPg extends BaseRepositoryPg<Notification, CreateNotificationDto, UpdateNotificationDto> implements INotificationRepository {
  constructor() {
    super('notification');
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
