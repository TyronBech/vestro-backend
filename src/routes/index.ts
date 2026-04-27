import { Router } from "express";
import { profileRouter } from "./profile.route";

const apiRouter = Router();

apiRouter.use(profileRouter);

export { apiRouter };
