import { Router } from "express";
import { authRouter } from "./auth.route";
import { profileRouter } from "./profile.route";
import { transactionRouter } from "./transaction.route";
import { goalRouter } from "./goal.route";
import { dashboardRouter } from "./dashboard.route";
import { analyticsRouter } from "./analytics.route";
import { notificationRouter } from "./notification.route";

const apiRouter = Router();

// 1. Auth (Login, Register, Refresh)
apiRouter.use('/api/auth', authRouter);

// 2. Profile & User Settings
apiRouter.use('/api/profile', profileRouter);

// 3. Transactions (CRUD)
apiRouter.use('/api/transactions', transactionRouter);

// 4. Goals (Savings & Purchases)
apiRouter.use('/api/goals', goalRouter);

// 5. Dashboard (Home Screen Data)
apiRouter.use('/api/dashboard', dashboardRouter);

// 6. Analytics (Reports & Charts)
apiRouter.use('/api/analytics', analyticsRouter);

// 7. Notifications (Bell Icon)
apiRouter.use('/api/notifications', notificationRouter);

export { apiRouter };
