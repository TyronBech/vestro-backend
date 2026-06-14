import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema, verify2faSchema, verifySupabaseSchema, enableBiometricsSchema, biometricLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth.schema';

export const authRouter = Router();

authRouter.post('/signup', authRateLimiter, validate(signupSchema), AuthController.signup);
authRouter.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
authRouter.get('/login', (req, res) => {
  res.json({
    message: "Login endpoint. Please send a POST request with email and password.",
    methods: ["POST"],
    body: { email: "string", password: "string" }
  });
});

authRouter.post('/2fa/generate', authenticateJWT, authRateLimiter, AuthController.generate2fa);
authRouter.post('/2fa/enable', authenticateJWT, authRateLimiter, validate(verify2faSchema), AuthController.enable2fa);
authRouter.post('/2fa/login', authRateLimiter, validate(verify2faSchema), AuthController.loginWith2fa);

authRouter.post('/supabase/verify', authRateLimiter, validate(verifySupabaseSchema), AuthController.verifySupabase);
authRouter.post('/biometrics/enable', authenticateJWT, authRateLimiter, validate(enableBiometricsSchema), AuthController.enableBiometrics);
authRouter.post('/biometrics/login', authRateLimiter, validate(biometricLoginSchema), AuthController.biometricLogin);

authRouter.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
