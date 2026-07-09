import { Router } from "express";
import { authRouter } from "./auth.route";
import { profileRouter } from "./profile.route";
import { budgetRouter } from "./budget.route";
import { creditCardRouter } from "./credit-card.route";
import { macroAssetRouter } from "./macro-asset.route";
import { sweepRouter } from "./sweep.route";
import { dashboardRouter } from "./dashboard.route";
import { coreNetworkRouter } from "./core-network.route";
import cashFlowRouter from "./cash-flow.route";
import { analyticsRouter } from "./analytics.route";
import { notificationRouter } from "./notification.route";

const apiRouter = Router();

// 1. Auth (Login, Register, Refresh, 2FA, Biometrics, Password Reset)
apiRouter.use('/auth', authRouter);

// 2. Profile & User Settings
apiRouter.use('/profile', profileRouter);

// 3. Budget Config & Payday Guillotine (Pipeline A)
apiRouter.use('/budget', budgetRouter);

// 4. Credit Cards & Credit Shield (Pipeline B)
apiRouter.use('/credit-cards', creditCardRouter);

// 5. Macro Assets / Bank Buckets
apiRouter.use('/macro-assets', macroAssetRouter);

// 6. End-of-Cycle Sweep (Pipeline C)
apiRouter.use('/sweep', sweepRouter);

// 7. Dashboard (Home Screen Summary)
apiRouter.use('/dashboard', dashboardRouter);

// 8. Core Network Routing Tree
apiRouter.use('/core-network', coreNetworkRouter);

// 9. Cash Flows (Inflows & Outflows for Core Networks)
apiRouter.use('/cash-flows', cashFlowRouter);

// 10. Analytics Telemetry
apiRouter.use('/analytics', analyticsRouter);

// 11. Push Notifications & In-App Alerts
apiRouter.use('/notifications', notificationRouter);

// 12. Health Check / Ping Endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ ok: true, message: "Backend engine running" });
});

export { apiRouter };
