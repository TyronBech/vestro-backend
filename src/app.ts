import cors from "cors";
import express from "express";
import { errorHandler } from "./presentation/middleware/errorHandler";
import { notFoundHandler } from "./presentation/middleware/notFound";
import { apiRateLimiter } from "./presentation/middleware/rate-limiter.middleware";
import { idempotencyMiddleware } from "./presentation/middleware/idempotency.middleware";
import { apiRouter } from "./presentation/routes";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(idempotencyMiddleware);

  app.use("/api", apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
