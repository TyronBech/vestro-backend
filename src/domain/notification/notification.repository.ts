import { Notification, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateNotificationDto = Prisma.NotificationCreateInput;
export type UpdateNotificationDto = Prisma.NotificationUpdateInput;

export interface INotificationRepository extends IBaseRepository<Notification, CreateNotificationDto, UpdateNotificationDto> {
  findByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification>;
}
