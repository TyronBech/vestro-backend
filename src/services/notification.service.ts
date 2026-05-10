import { Result, ok, err } from '../utils/result';
import { NotificationRepositoryPg } from '../infrastructure/db/notification.repository.pg';
import { logger } from '../utils/logger';

const notificationRepo = new NotificationRepositoryPg();

export class NotificationService {
  static async listNotifications(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing listNotifications service for userId: ${userId}`);
      const notifications = await notificationRepo.findByUserId(userId);
      logger.info(`listNotifications service completed successfully for userId: ${userId}, count: ${notifications.length}`);
      return ok(notifications);
    } catch (error) {
      logger.error(`listNotifications service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  static async markAsRead(userId: string, notificationId: string): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing markAsRead service for userId: ${userId}, notificationId: ${notificationId}`);
      const notification = await notificationRepo.findByUserIdAndId(userId, notificationId);
      if (!notification) {
        logger.warn(`markAsRead failed: Notification not found for userId: ${userId}, notificationId: ${notificationId}`);
        return err('NOT_FOUND');
      }

      await notificationRepo.markAsRead(notificationId);
      logger.info(`markAsRead service completed successfully for userId: ${userId}, notificationId: ${notificationId}`);
      return ok(true);
    } catch (error) {
      logger.error(`markAsRead service DB_ERROR for userId ${userId}, notificationId: ${notificationId}:`, error);
      return err('DB_ERROR');
    }
  }
}
