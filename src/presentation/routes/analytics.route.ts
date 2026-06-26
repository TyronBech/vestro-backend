import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

export const analyticsRouter = Router();

analyticsRouter.get('/', authenticateJWT, AnalyticsController.getAnalyticsData);
