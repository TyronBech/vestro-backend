import { PushToken, Notification, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreatePushTokenDto = Prisma.PushTokenUncheckedCreateInput;
export type UpdatePushTokenDto = Prisma.PushTokenUncheckedUpdateInput;

export type CreateNotificationDto = Prisma.NotificationUncheckedCreateInput;
export type UpdateNotificationDto = Prisma.NotificationUncheckedUpdateInput;

/**
 * Domain interface for PushToken persistence operations.
 */
export interface IPushTokenRepository extends IBaseRepository<PushToken, CreatePushTokenDto, UpdatePushTokenDto> {
  /** Finds all push tokens registered to a user. */
  findByUserId(userId: string): Promise<PushToken[]>;

  /** Finds a specific push token by its value. */
  findByToken(token: string): Promise<PushToken | null>;

  /** Removes a token from registration. */
  deleteByToken(token: string): Promise<void>;
}

/**
 * Domain interface for Notification persistence operations.
 */
export interface INotificationRepository extends IBaseRepository<Notification, CreateNotificationDto, UpdateNotificationDto> {
  /** Finds all notifications for a user, ordered by creation date descending. */
  findByUserId(userId: string): Promise<Notification[]>;

  /** Marks a specific notification as read. */
  markAsRead(id: string): Promise<Notification>;

  /** Marks all notifications for a user as read. */
  markAllAsRead(userId: string): Promise<void>;
}
