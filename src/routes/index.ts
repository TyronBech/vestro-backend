import { Router } from "express";
import { healthRouter } from "./health.route";
import { profileRouter } from "./profile.route";

const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(profileRouter);

export { apiRouter };
