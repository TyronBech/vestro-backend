import { Request, Response } from 'express';
import { NotificationService } from '../../services/notification.service';

export class NotificationController {
  static async listNotifications(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await NotificationService.listNotifications(userId);
    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list notifications' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }

  static async markAsRead(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { id } = req.params;
    const result = await NotificationService.markAsRead(userId, id);
    if (!result.ok) {
      res.status(404).json({ errors: [{ code: result.error, message: 'Notification not found' }] });
      return;
    }
    res.status(200).json({ data: { success: true } });
  }
}
