import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import { z } from 'zod';
import { supabase } from '../config/supabase';

import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { Result, ok, err } from '../utils/result';
import { env } from '../config/env';
import {
  signupSchema,
  loginSchema,
  verify2faSchema,
  verifySupabaseSchema,
  biometricLoginSchema,
} from '../presentation/schemas/auth.schema';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN as any;

const userRepo = new UserRepositoryPg();

export class AuthService {
  // ── Email / Password ────────────────────────────────────────────────────────

  static async signup(
    input: z.infer<typeof signupSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'USER_EXISTS' | 'DB_ERROR'>> {
    try {
      const existingUser = await userRepo.findByEmail(input.email);
      if (existingUser) return err('USER_EXISTS');

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await userRepo.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      });

      const token = this.generateToken(user.id, user.email, false);
      return ok({ user, token });
    } catch {
      return err('DB_ERROR');
    }
  }

  static async login(
    input: z.infer<typeof loginSchema>['body'],
  ): Promise<Result<{ user?: any; token?: string; requires2fa?: boolean }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findByEmail(input.email);
      if (!user || !user.passwordHash) return err('INVALID_CREDENTIALS');

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) return err('INVALID_CREDENTIALS');

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      if (user.twoFactorEnabled) {
        return ok({ user: { id: user.id, email: user.email }, token: '', requires2fa: true });
      }

      const token = this.generateToken(user.id, user.email, false);
      return ok({ user, token });
    } catch {
      return err('DB_ERROR');
    }
  }

  // ── Google OAuth via Supabase ────────────────────────────────────────────────

  static async verifySupabaseLogin(
    input: z.infer<typeof verifySupabaseSchema>['body'],
  ): Promise<Result<{ user?: any; token?: string; requires2fa?: boolean }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      const { data, error } = await supabase.auth.getUser(input.supabaseToken);
      if (error || !data.user) return err('INVALID_CREDENTIALS');

      const sbUser = data.user;
      const email = sbUser.email || '';
      const nameParts = (sbUser.user_metadata?.full_name ?? '').split(' ');

      let user = await userRepo.findByEmail(email);
      if (!user) {
        user = await userRepo.create({
          email,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
        });
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      if (user.twoFactorEnabled) {
        return ok({ user: { id: user.id, email: user.email }, token: '', requires2fa: true });
      }

      const token = this.generateToken(user.id, user.email, false);
      return ok({ user, token });
    } catch {
      return err('DB_ERROR');
    }
  }

  // ── Google Authenticator (TOTP / 2FA) ───────────────────────────────────────

  static async generate2faSecret(
    userId: string,
  ): Promise<Result<{ secret: string; otpauthUrl: string }, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findById(userId);
      if (!user) return err('USER_NOT_FOUND');

      const secret = generateSecret();
      const otpauthUrl = generateURI({ label: user.email, issuer: 'Vestro', secret });

      await userRepo.update(userId, { twoFactorSecret: secret });

      return ok({ secret, otpauthUrl });
    } catch {
      return err('DB_ERROR');
    }
  }

  static async verifyAndEnable2fa(
    input: z.infer<typeof verify2faSchema>['body'],
  ): Promise<Result<boolean, 'USER_NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findById(input.userId);
      if (!user || !user.twoFactorSecret) return err('USER_NOT_FOUND');

      const isValid = verify({ token: input.token, secret: user.twoFactorSecret });
      if (!isValid) return err('INVALID_TOKEN');

      await userRepo.update(user.id, { twoFactorEnabled: true });

      return ok(true);
    } catch {
      return err('DB_ERROR');
    }
  }

  static async loginWith2fa(
    input: z.infer<typeof verify2faSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'USER_NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findById(input.userId);
      if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) return err('USER_NOT_FOUND');

      const isValid = verify({ token: input.token, secret: user.twoFactorSecret });
      if (!isValid) return err('INVALID_TOKEN');

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      const token = this.generateToken(user.id, user.email, true);
      return ok({ user, token });
    } catch {
      return err('DB_ERROR');
    }
  }

  // ── Biometrics (Session Timeout Re-auth) ────────────────────────────────────

  static async enableBiometrics(
    userId: string,
  ): Promise<Result<{ biometricKey: string }, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findById(userId);
      if (!user) return err('USER_NOT_FOUND');

      const rawKey = crypto.randomBytes(32).toString('hex');
      const biometricKeyHash = await bcrypt.hash(rawKey, 10);

      await userRepo.update(userId, { biometricsEnabled: true, biometricKeyHash });

      return ok({ biometricKey: rawKey });
    } catch {
      return err('DB_ERROR');
    }
  }

  static async biometricLogin(
    input: z.infer<typeof biometricLoginSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      const user = await userRepo.findById(input.userId);
      if (!user || !user.biometricsEnabled || !user.biometricKeyHash) {
        return err('INVALID_CREDENTIALS');
      }

      const isValid = await bcrypt.compare(input.biometricKey, user.biometricKeyHash);
      if (!isValid) return err('INVALID_CREDENTIALS');

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      const token = this.generateToken(user.id, user.email, user.twoFactorEnabled);
      return ok({ user, token });
    } catch {
      return err('DB_ERROR');
    }
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  private static generateToken(id: string, email: string, twoFactorVerified: boolean): string {
    return jwt.sign({ id, email, twoFactorVerified }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}
