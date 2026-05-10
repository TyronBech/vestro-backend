import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/logger';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for user: ${req.body.email}`);
    res.status(options.statusCode).json(options.message);
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for user: ${req.body.email}`);
    res.status(options.statusCode).json(options.message);
  },
});
