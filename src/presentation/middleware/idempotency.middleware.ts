import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

interface IdempotencyRecord {
  status: 'processing' | 'completed';
  statusCode?: number;
  responseBody?: any;
  createdAt: number;
}

const cache = new Map<string, IdempotencyRecord>();

// Clean up entries older than 5 minutes every minute
setInterval(() => {
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minutes
  for (const [key, record] of cache.entries()) {
    if (now - record.createdAt > TTL) {
      cache.delete(key);
    }
  }
}, 60000);

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers['x-idempotency-key'] as string;
  if (!key) {
    return next();
  }

  logger.info(`Idempotency middleware triggered for key: ${key}`);

  const record = cache.get(key);
  if (record) {
    if (record.status === 'processing') {
      logger.warn(`Idempotency key ${key} is already processing, returning 409 conflict`);
      res.status(409).json({
        errors: [{ code: 'CONFLICT', message: 'Request is already being processed.' }]
      });
      return;
    }

    if (record.status === 'completed') {
      logger.info(`Idempotency key ${key} found in cache, returning cached response`);
      res.status(record.statusCode || 200).json(record.responseBody);
      return;
    }
  }

  // Register in-progress request
  cache.set(key, {
    status: 'processing',
    createdAt: Date.now()
  });

  // Intercept response sending
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (body: any): Response {
    cache.set(key, {
      status: 'completed',
      statusCode: res.statusCode,
      responseBody: body,
      createdAt: Date.now()
    });
    return originalJson.call(this, body);
  };

  res.send = function (body: any): Response {
    let parsedBody = body;
    try {
      if (typeof body === 'string') {
        parsedBody = JSON.parse(body);
      }
    } catch {}

    cache.set(key, {
      status: 'completed',
      statusCode: res.statusCode,
      responseBody: parsedBody,
      createdAt: Date.now()
    });
    return originalSend.call(this, body);
  };

  next();
};
