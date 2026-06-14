import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { Result, ok, err } from '../utils/result';
import { env } from '../config/env';
import {
  signupSchema,
  loginSchema,
  verify2faSchema,
  verifySupabaseSchema,
  biometricLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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
      logger.info(`Executing signup service for email: ${input.email}`);
      const existingUser = await userRepo.findByEmail(input.email);
      if (existingUser) {
        logger.warn(`Signup failed: User already exists for email: ${input.email}`);
        return err('USER_EXISTS');
      }

      logger.info(`Hashing password for new user: ${input.email}`);
      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await userRepo.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      });

      const token = this.generateToken(user.id, user.email, false);
      logger.info(`Signup service completed successfully for user: ${input.email}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`Signup service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  static async login(
    input: z.infer<typeof loginSchema>['body'],
  ): Promise<Result<{ user?: any; token?: string; requires2fa?: boolean }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing login service for email: ${input.email}`);
      const user = await userRepo.findByEmail(input.email);
      if (!user || !user.passwordHash) {
        logger.warn(`Login failed: User not found or no password hash for email: ${input.email}`);
        return err('INVALID_CREDENTIALS');
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        logger.warn(`Login failed: Invalid password for email: ${input.email}`);
        return err('INVALID_CREDENTIALS');
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      if (user.twoFactorEnabled) {
        logger.info(`Login service requiring 2FA for user: ${input.email}`);
        return ok({ user: { id: user.id, email: user.email }, token: '', requires2fa: true });
      }

      const token = this.generateToken(user.id, user.email, false);
      logger.info(`Login service completed successfully for user: ${input.email}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`Login service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  // ── Google OAuth via Supabase ────────────────────────────────────────────────

  static async verifySupabaseLogin(
    input: z.infer<typeof verifySupabaseSchema>['body'],
  ): Promise<Result<{ user?: any; token?: string; requires2fa?: boolean }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing verifySupabaseLogin service`);
      const { data, error } = await supabase.auth.getUser(input.supabaseToken);
      if (error || !data.user) {
        logger.warn(`verifySupabaseLogin failed: Invalid token or user not found. Error: ${error?.message}`);
        return err('INVALID_CREDENTIALS');
      }

      const sbUser = data.user;
      const email = sbUser.email || '';
      const nameParts = (sbUser.user_metadata?.full_name ?? '').split(' ');

      let user = await userRepo.findByEmail(email);
      if (!user) {
        logger.info(`Creating new user from Supabase login: ${email}`);
        user = await userRepo.create({
          email,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
        });
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      if (user.twoFactorEnabled) {
        logger.info(`verifySupabaseLogin requiring 2FA for user: ${email}`);
        return ok({ user: { id: user.id, email: user.email }, token: '', requires2fa: true });
      }

      const token = this.generateToken(user.id, user.email, false);
      logger.info(`verifySupabaseLogin service completed successfully for user: ${email}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`verifySupabaseLogin service DB_ERROR:`, error);
      return err('DB_ERROR');
    }
  }

  // ── Google Authenticator (TOTP / 2FA) ───────────────────────────────────────

  static async generate2faSecret(
    userId: string,
  ): Promise<Result<{ secret: string; otpauthUrl: string }, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing generate2faSecret service for userId: ${userId}`);
      const user = await userRepo.findById(userId);
      if (!user) {
        logger.warn(`generate2faSecret failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      const secret = generateSecret();
      const otpauthUrl = generateURI({ label: user.email, issuer: 'Vestro', secret });

      await userRepo.update(userId, { twoFactorSecret: secret });

      logger.info(`generate2faSecret service completed successfully for userId: ${userId}`);
      return ok({ secret, otpauthUrl });
    } catch (error) {
      logger.error(`generate2faSecret service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  static async verifyAndEnable2fa(
    input: z.infer<typeof verify2faSchema>['body'],
  ): Promise<Result<boolean, 'USER_NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing verifyAndEnable2fa service for userId: ${input.userId}`);
      const user = await userRepo.findById(input.userId);
      if (!user || !user.twoFactorSecret) {
        logger.warn(`verifyAndEnable2fa failed: User not found or secret missing for userId: ${input.userId}`);
        return err('USER_NOT_FOUND');
      }

      const isValid = verify({ token: input.token, secret: user.twoFactorSecret });
      if (!isValid) {
        logger.warn(`verifyAndEnable2fa failed: Invalid token for userId: ${input.userId}`);
        return err('INVALID_TOKEN');
      }

      await userRepo.update(user.id, { twoFactorEnabled: true });

      logger.info(`verifyAndEnable2fa service completed successfully for userId: ${input.userId}`);
      return ok(true);
    } catch (error) {
      logger.error(`verifyAndEnable2fa service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  static async loginWith2fa(
    input: z.infer<typeof verify2faSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'USER_NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing loginWith2fa service for userId: ${input.userId}`);
      const user = await userRepo.findById(input.userId);
      if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
        logger.warn(`loginWith2fa failed: User not found or 2FA disabled for userId: ${input.userId}`);
        return err('USER_NOT_FOUND');
      }

      const isValid = verify({ token: input.token, secret: user.twoFactorSecret });
      if (!isValid) {
        logger.warn(`loginWith2fa failed: Invalid token for userId: ${input.userId}`);
        return err('INVALID_TOKEN');
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      const token = this.generateToken(user.id, user.email, true);
      logger.info(`loginWith2fa service completed successfully for userId: ${input.userId}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`loginWith2fa service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  // ── Biometrics (Session Timeout Re-auth) ────────────────────────────────────

  static async enableBiometrics(
    userId: string,
  ): Promise<Result<{ biometricKey: string }, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing enableBiometrics service for userId: ${userId}`);
      const user = await userRepo.findById(userId);
      if (!user) {
        logger.warn(`enableBiometrics failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      const rawKey = crypto.randomBytes(32).toString('hex');
      const biometricKeyHash = await bcrypt.hash(rawKey, 10);

      await userRepo.update(userId, { biometricsEnabled: true, biometricKeyHash });

      logger.info(`enableBiometrics service completed successfully for userId: ${userId}`);
      return ok({ biometricKey: rawKey });
    } catch (error) {
      logger.error(`enableBiometrics service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  static async biometricLogin(
    input: z.infer<typeof biometricLoginSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'INVALID_CREDENTIALS' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing biometricLogin service for userId: ${input.userId}`);
      const user = await userRepo.findById(input.userId);
      if (!user || !user.biometricsEnabled || !user.biometricKeyHash) {
        logger.warn(`biometricLogin failed: User not found or biometrics disabled for userId: ${input.userId}`);
        return err('INVALID_CREDENTIALS');
      }

      const isValid = await bcrypt.compare(input.biometricKey, user.biometricKeyHash);
      if (!isValid) {
        logger.warn(`biometricLogin failed: Invalid biometric key for userId: ${input.userId}`);
        return err('INVALID_CREDENTIALS');
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      const token = this.generateToken(user.id, user.email, user.twoFactorEnabled);
      logger.info(`biometricLogin service completed successfully for userId: ${input.userId}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`biometricLogin service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  static async forgotPassword(
    input: z.infer<typeof forgotPasswordSchema>['body'],
  ): Promise<Result<{ success: boolean }, 'DB_ERROR'>> {
    try {
      logger.info(`Executing forgotPassword service for email: ${input.email}`);
      const user = await userRepo.findByEmail(input.email);
      if (!user) {
        // Log warning but return ok to prevent user enumeration
        logger.warn(`Forgot password request for non-existent email: ${input.email}`);
        return ok({ success: true });
      }

      // Generate a 6-digit random OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await userRepo.update(user.id, {
        resetPasswordToken: otp,
        resetPasswordExpires: expires,
      });

      // Crucial: Log OTP to console for development use
      logger.info(`[PASSWORD RESET OTP] OTP for ${input.email} is ${otp}`);

      return ok({ success: true });
    } catch (error) {
      logger.error(`forgotPassword service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  static async resetPassword(
    input: z.infer<typeof resetPasswordSchema>['body'],
  ): Promise<Result<{ success: boolean }, 'USER_NOT_FOUND' | 'INVALID_OR_EXPIRED_OTP' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing resetPassword service for email: ${input.email}`);
      const user = await userRepo.findByEmail(input.email);
      if (!user) {
        logger.warn(`resetPassword failed: User not found for email: ${input.email}`);
        return err('USER_NOT_FOUND');
      }

      if (
        !user.resetPasswordToken ||
        !user.resetPasswordExpires ||
        user.resetPasswordToken !== input.otp ||
        user.resetPasswordExpires.getTime() < Date.now()
      ) {
        logger.warn(`resetPassword failed: Invalid or expired OTP for email: ${input.email}`);
        return err('INVALID_OR_EXPIRED_OTP');
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      await userRepo.update(user.id, {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      logger.info(`resetPassword service completed successfully for email: ${input.email}`);
      return ok({ success: true });
    } catch (error) {
      logger.error(`resetPassword service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  // ── Shared ──────────────────────────────────────────────────────────────────

  private static generateToken(id: string, email: string, twoFactorVerified: boolean): string {
    return jwt.sign({ id, email, twoFactorVerified }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}
