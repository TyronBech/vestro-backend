import { Response } from 'express';
import { NotificationService } from '../../services/notification.service';
import { SchedulerService } from '../../services/scheduler.service';
import { logger } from '../../utils/logger';

export class NotificationController {
  /**
   * GET /api/notifications
   * Lists all notifications for the authenticated user.
   */
  static async list(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('listNotifications failed: Unauthorized');
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`listNotifications requested for userId: ${userId}`);
    const result = await NotificationService.listNotifications(userId);

    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to retrieve notifications' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  /**
   * POST /api/notifications/register
   * Registers a new push token for the user.
   */
  static async register(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('registerToken failed: Unauthorized');
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const { token, deviceType, deviceName } = req.body;
    logger.info(`registerToken requested for userId: ${userId}, token: ${token}`);
    const result = await NotificationService.registerToken(userId, token, deviceType, deviceName);

    if (!result.ok) {
      const status = result.error === 'INVALID_TOKEN' ? 400 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to register token' }] });
      return;
    }

    res.status(201).json({ data: result.value });
  }

  /**
   * POST /api/notifications/unregister
   * Removes a push token registration.
   */
  static async unregister(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('unregisterToken failed: Unauthorized');
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const { token } = req.body;
    logger.info(`unregisterToken requested for userId: ${userId}, token: ${token}`);
    const result = await NotificationService.unregisterToken(userId, token);

    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to unregister token' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marks a specific notification as read.
   */
  static async markRead(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('markRead failed: Unauthorized');
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const { id } = req.params;
    logger.info(`markRead requested for userId: ${userId}, notificationId: ${id}`);
    const result = await NotificationService.markAsRead(userId, id);

    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to mark notification as read' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  /**
   * POST /api/notifications/mark-all-read
   * Marks all notifications of the user as read.
   */
  static async markAllRead(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      logger.warn('markAllRead failed: Unauthorized');
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`markAllRead requested for userId: ${userId}`);
    const result = await NotificationService.markAllAsRead(userId);

    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to mark notifications as read' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  /**
   * POST /api/notifications/test-trigger
   * Developer helper to trigger test push notifications or execute cron check logic instantly.
   */
  static async testTrigger(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const { type } = req.body;
    logger.info(`Developer testTrigger executed with type: ${type}`);

    try {
      if (type === 'CREDIT_DUE') {
        await SchedulerService.runCreditDueCheck();
        res.status(200).json({ data: { message: 'Credit due check triggered successfully.' } });
      } else if (type === 'WANTS_SWEEP') {
        await SchedulerService.runWantsSweepReminder();
        res.status(200).json({ data: { message: 'Wants Sweep reminder check triggered successfully.' } });
      } else if (type === 'CASH_FLOW') {
        await SchedulerService.runCashFlowReminder();
        res.status(200).json({ data: { message: 'Cash Flow update reminder triggered successfully.' } });
      } else {
        // Direct test push notification
        const title = 'Vestro Push Test';
        const body = 'This is an instant manual test push notification from your developer panel!';
        const data = { type: 'TEST_PUSH', triggeredAt: new Date().toISOString() };
        
        await NotificationService.sendToUser(userId, title, body, data);
        res.status(200).json({ data: { message: 'Direct test notification sent.' } });
      }
    } catch (error: any) {
      logger.error('Error in developer testTrigger:', error);
      res.status(500).json({ errors: [{ code: 'TEST_TRIGGER_ERROR', message: error.message }] });
    }
  }
}
