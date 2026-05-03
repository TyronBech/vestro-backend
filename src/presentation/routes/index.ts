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
apiRouter.use('/auth', authRouter);

// 2. Profile & User Settings
apiRouter.use('/profile', profileRouter);

// 3. Transactions (CRUD)
apiRouter.use('/transactions', transactionRouter);

// 4. Goals (Savings & Purchases)
apiRouter.use('/goals', goalRouter);

// 5. Dashboard (Home Screen Data)
apiRouter.use('/dashboard', dashboardRouter);

// 6. Analytics (Reports & Charts)
apiRouter.use('/analytics', analyticsRouter);

// 7. Notifications (Bell Icon)
apiRouter.use('/notifications', notificationRouter);

export { apiRouter };
