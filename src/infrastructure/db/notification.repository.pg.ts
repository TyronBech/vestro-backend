import { Notification } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { INotificationRepository, CreateNotificationDto, UpdateNotificationDto } from '../../domain/notification/notification.repository';

export class NotificationRepositoryPg extends BaseRepositoryPg<Notification, CreateNotificationDto, UpdateNotificationDto> implements INotificationRepository {
  constructor() {
    super('notification');
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.db.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
