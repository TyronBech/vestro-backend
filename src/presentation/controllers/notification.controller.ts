import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';
import { logger } from '../../utils/logger';

export class NotificationController {
  static async listNotifications(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`listNotifications request received for user: ${req.user?.email}`);
    const result = await NotificationService.listNotifications(userId);
    if (!result.ok) {
      logger.error(`listNotifications failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list notifications' }] });
      return;
    }
    logger.info(`listNotifications request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  static async markAsRead(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { id } = req.params;
    logger.info(`markAsRead request received for user: ${req.user?.email}, notificationId: ${id}`);
    const result = await NotificationService.markAsRead(userId, id);
    if (!result.ok) {
      logger.error(`markAsRead failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(404).json({ errors: [{ code: result.error, message: 'Notification not found' }] });
      return;
    }
    logger.info(`markAsRead request successful for user: ${req.user?.email}, notificationId: ${id}`);
    res.status(200).json({ data: { success: true } });
  }
}
