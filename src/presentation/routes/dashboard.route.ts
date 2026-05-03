import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', authenticateJWT, DashboardController.getDashboardData);
