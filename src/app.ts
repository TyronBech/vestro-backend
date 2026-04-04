import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
