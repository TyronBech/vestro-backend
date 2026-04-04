import { Router } from "express";
import { getProfileController } from "../controllers/profile.controller";

const profileRouter = Router();

profileRouter.get("/profile", getProfileController);

export { profileRouter };
