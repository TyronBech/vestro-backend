import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN as any;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    twoFactorVerified?: boolean;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1] as string;

    logger.info(`Token verification started for user: ${token}`);

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.error(`Token verification failed: ${err.message}`);
        res.status(401).json({
          errors: [{ code: 'UNAUTHORIZED', message: 'Token is invalid or expired' }],
        });
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsed = currentTime - decoded.iat; 

      if (timeElapsed > 300) {
        const newToken = jwt.sign(
          {
            id: decoded.id,
            email: decoded.email,
            twoFactorVerified: decoded.twoFactorVerified,
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info(`Token refreshed for user: ${newToken}`);
        res.setHeader('x-refreshed-token', newToken);
        res.setHeader('Access-Control-Expose-Headers', 'x-refreshed-token');
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        twoFactorVerified: decoded.twoFactorVerified,
      };

      logger.info(`Token verification successful for user: ${decoded.email}`);
      next();
    });
  } else {
    logger.error('Authorization header is missing');
    res.status(401).json({
      errors: [{ code: 'UNAUTHORIZED', message: 'Authorization header is missing' }],
    });
    return;
  }
};