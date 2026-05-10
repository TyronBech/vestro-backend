import { Request, Response } from "express";
import { logger } from "../../utils/logger";

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 Not Found - Route: ${req.originalUrl}, Method: ${req.method}, IP: ${req.ip}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found.`,
  });
};
