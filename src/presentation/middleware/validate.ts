// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the incoming request against the Zod schema
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // If validation passes, move to the next function (your controller)
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format the Zod errors cleanly for the frontend to consume
        const formattedErrors = error.issues.map((e) => ({
          field: e.path.join('.').replace('body.', ''),
          message: e.message,
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Data validation failed',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };