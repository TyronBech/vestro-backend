import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { analyticsFilterSchema } from '../schemas/analytics.schema';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics', authenticateJWT, validate(analyticsFilterSchema), AnalyticsController.getReport);
