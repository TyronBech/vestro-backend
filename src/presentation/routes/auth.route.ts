import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema, verify2faSchema, verifySupabaseSchema, enableBiometricsSchema, biometricLoginSchema } from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post('/auth/signup', authRateLimiter, validate(signupSchema), AuthController.signup);
authRouter.post('/auth/login', authRateLimiter, validate(loginSchema), AuthController.login);

authRouter.post('/auth/2fa/generate', authenticateJWT, authRateLimiter, AuthController.generate2fa);
authRouter.post('/auth/2fa/enable', authenticateJWT, authRateLimiter, validate(verify2faSchema), AuthController.enable2fa);
authRouter.post('/auth/2fa/login', authRateLimiter, validate(verify2faSchema), AuthController.loginWith2fa);

authRouter.post('/auth/supabase/verify', authRateLimiter, validate(verifySupabaseSchema), AuthController.verifySupabase);
authRouter.post('/auth/biometrics/enable', authenticateJWT, authRateLimiter, validate(enableBiometricsSchema), AuthController.enableBiometrics);
authRouter.post('/auth/biometrics/login', authRateLimiter, validate(biometricLoginSchema), AuthController.biometricLogin);
