import { Router } from "express";
import { authRouter } from "./auth.route";
import { profileRouter } from "./profile.route";
import { budgetRouter } from "./budget.route";
import { creditCardRouter } from "./credit-card.route";
import { macroAssetRouter } from "./macro-asset.route";
import { sweepRouter } from "./sweep.route";
import { dashboardRouter } from "./dashboard.route";
import { coreNetworkRouter } from "./core-network.route";

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

export { apiRouter };
