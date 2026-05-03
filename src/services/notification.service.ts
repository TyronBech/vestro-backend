import { Result, ok, err } from '../utils/result';
import { NotificationRepositoryPg } from '../infrastructure/db/notification.repository.pg';

const notificationRepo = new NotificationRepositoryPg();

export class NotificationService {
  static async listNotifications(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      const notifications = await notificationRepo.findByUserId(userId);
      return ok(notifications);
    } catch {
      return err('DB_ERROR');
    }
  }

  static async markAsRead(userId: string, notificationId: string): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      const notification = await notificationRepo.findByUserIdAndId(userId, notificationId);
      if (!notification) return err('NOT_FOUND');

      await notificationRepo.markAsRead(notificationId);
      return ok(true);
    } catch {
      return err('DB_ERROR');
    }
  }
}
