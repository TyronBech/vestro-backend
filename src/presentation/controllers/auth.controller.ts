import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import qrcode from 'qrcode';
import { logger } from '../../utils/logger';

export class AuthController {
  static async signup(req: Request, res: Response): Promise<void> {
    logger.info(`Signup request received for user: ${req.body.email}`);
    const result = await AuthService.signup(req.body);
    if (!result.ok) {
      logger.error(`Signup failed for user: ${req.body.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Signup failed' }] });
      return;
    }
    logger.info(`Signup successful for user: ${req.body.email}`);
    res.status(201).json({ data: result.value });
  }

  static async login(req: Request, res: Response): Promise<void> {
    logger.info(`Login request received for user: ${req.body.email}`);
    const result = await AuthService.login(req.body);
    if (!result.ok) {
      logger.error(`Login failed for user: ${req.body.email}, Error: ${result.error}`);
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid credentials' }] });
      return;
    }
    logger.info(`Login successful for user: ${req.body.email}`);
    res.status(200).json({ data: result.value });
  }

  static async generate2fa(req: any, res: Response): Promise<void> {
    logger.info(`Generate 2FA request received for user: ${req.user?.email}`);
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }
    const result = await AuthService.generate2faSecret(userId);
    if (!result.ok) {
      logger.error(`Failed to generate 2FA for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to generate 2FA' }] });
      return;
    }
    const qrCodeImage = await qrcode.toDataURL(result.value.otpauthUrl);
    logger.info(`Generate 2FA request successful for user: ${req.user?.email}`);
    res.status(200).json({
      data: {
        secret: result.value.secret,
        qrCodeImage,
      },
    });
  }

  static async enable2fa(req: any, res: Response): Promise<void> {
    logger.info(`Enable 2FA request received for user: ${req.user?.email}`);
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }
    const result = await AuthService.verifyAndEnable2fa({ userId, token: req.body.token });
    if (!result.ok) {
      logger.error(`Failed to enable 2FA for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Invalid 2FA token' }] });
      return;
    }
    logger.info(`Enable 2FA request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: { success: true } });
  }

  static async loginWith2fa(req: Request, res: Response): Promise<void> {
    logger.info(`Login with 2FA request received for user: ${req.body.email}`);
    const result = await AuthService.loginWith2fa(req.body);
    if (!result.ok) {
      logger.error(`Failed to login with 2FA for user: ${req.body.email}, Error: ${result.error}`);
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid 2FA token' }] });
      return;
    }
    logger.info(`Login with 2FA request successful for user: ${req.body.email}`);
    res.status(200).json({ data: result.value });
  }

  static async verifySupabase(req: Request, res: Response): Promise<void> {
    logger.info(`Verify Supabase request received for user: ${req.body.email}`);
    const result = await AuthService.verifySupabaseLogin(req.body);
    if (!result.ok) {
      logger.error(`Failed to verify Supabase for user: ${req.body.email}, Error: ${result.error}`);
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid Supabase token' }] });
      return;
    }
    logger.info(`Verify Supabase request successful for user: ${req.body.email}`);
    res.status(200).json({ data: result.value });
  }

  static async enableBiometrics(req: any, res: Response): Promise<void> {
    logger.info(`Enable biometrics request received for user: ${req.user?.email}`);
    const userId = req.user?.id;
    if (!userId) {
      logger.error(`Not authenticated`);
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await AuthService.enableBiometrics(userId);
    if (!result.ok) {
      logger.error(`Failed to enable biometrics for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to enable biometrics' }] });
      return;
    }
    logger.info(`Enable biometrics request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  static async biometricLogin(req: Request, res: Response): Promise<void> {
    logger.info(`Biometric login request received for user: ${req.body.email}`);
    const result = await AuthService.biometricLogin(req.body);
    if (!result.ok) {
      logger.error(`Failed to biometric login for user: ${req.body.email}, Error: ${result.error}`);
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid biometric key' }] });
      return;
    }
    logger.info(`Biometric login request successful for user: ${req.body.email}`);
    res.status(200).json({ data: result.value });
  }
}
