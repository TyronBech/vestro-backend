import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import qrcode from 'qrcode';

export class AuthController {
  static async signup(req: Request, res: Response): Promise<void> {
    const result = await AuthService.signup(req.body);
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Signup failed' }] });
      return;
    }
    res.status(201).json({ data: result.value });
  }

  static async login(req: Request, res: Response): Promise<void> {
    const result = await AuthService.login(req.body);
    if (!result.ok) {
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid credentials' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }

  static async generate2fa(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await AuthService.generate2faSecret(userId);
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to generate 2FA' }] });
      return;
    }

    const qrCodeImage = await qrcode.toDataURL(result.value.otpauthUrl);
    res.status(200).json({
      data: {
        secret: result.value.secret,
        qrCodeImage,
      },
    });
  }

  static async enable2fa(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await AuthService.verifyAndEnable2fa({ userId, token: req.body.token });
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Invalid 2FA token' }] });
      return;
    }

    res.status(200).json({ data: { success: true } });
  }

  static async loginWith2fa(req: Request, res: Response): Promise<void> {
    const result = await AuthService.loginWith2fa(req.body);
    if (!result.ok) {
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid 2FA token' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }

  static async verifySupabase(req: Request, res: Response): Promise<void> {
    const result = await AuthService.verifySupabaseLogin(req.body);
    if (!result.ok) {
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid Supabase token' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }

  static async enableBiometrics(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await AuthService.enableBiometrics(userId);
    if (!result.ok) {
      res.status(400).json({ errors: [{ code: result.error, message: 'Failed to enable biometrics' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  static async biometricLogin(req: Request, res: Response): Promise<void> {
    const result = await AuthService.biometricLogin(req.body);
    if (!result.ok) {
      res.status(401).json({ errors: [{ code: result.error, message: 'Invalid biometric key' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }
}
