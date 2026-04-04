import { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service";

export const getHealthController = async (_req: Request, res: Response) => {
  const payload = await getHealthStatus();
  res.status(200).json(payload);
};
