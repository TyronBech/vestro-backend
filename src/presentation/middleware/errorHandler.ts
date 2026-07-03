import { NextFunction, Request, Response } from "express";
import { logger } from "../../utils/logger";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error("Unhandled API error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error.",
  });
};
