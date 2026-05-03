import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

export const notificationRouter = Router();

notificationRouter.get('/notifications', authenticateJWT, NotificationController.listNotifications);
notificationRouter.patch('/notifications/:id/read', authenticateJWT, NotificationController.markAsRead);
