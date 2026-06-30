import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { registerTokenSchema, unregisterTokenSchema } from '../schemas/notification.schema';

export const notificationRouter = Router();

// 1. Get Notification List
notificationRouter.get('/', authenticateJWT, NotificationController.list);

// 2. Register/Unregister Push Tokens
notificationRouter.post('/register', authenticateJWT, validate(registerTokenSchema), NotificationController.register);
notificationRouter.post('/unregister', authenticateJWT, validate(unregisterTokenSchema), NotificationController.unregister);

// 3. Mark Notifications Read
notificationRouter.patch('/:id/read', authenticateJWT, NotificationController.markRead);
notificationRouter.post('/mark-all-read', authenticateJWT, NotificationController.markAllRead);

// 4. Developer Test Triggers
notificationRouter.post('/test-trigger', authenticateJWT, NotificationController.testTrigger);
