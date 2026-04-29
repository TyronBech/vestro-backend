import { Request, Response } from "express";
import { getDemoProfile } from "../services/profile.service";

export const getProfileController = (_req: Request, res: Response) => {
  res.status(200).json(getDemoProfile());
};
