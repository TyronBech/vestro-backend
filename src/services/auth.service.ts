import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify } from 'otplib';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { BudgetConfigRepositoryPg } from '../infrastructure/db/budget-config.repository.pg';
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

  /**
   * Registers a new user with email and password.
   * @param input Validated signup payload
   * @returns The created user and JWT, or an error code
   */
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
        name: input.name,
        passwordHash,
      });

      // Automatically create a default BudgetConfig for the new user
      const budgetRepo = new BudgetConfigRepositoryPg();
      await budgetRepo.upsertByUserId(user.id, {
        netSalary: 2500000, // Default ₱25,000.00 (in cents)
        needsRate: 0.50,
        wantsRate: 0.30,
        savingsRate: 0.10,
        investmentsRate: 0.10,
        cashAmount: 0,
      });

      const token = this.generateToken(user.id, user.email, false);
      logger.info(`Signup service completed successfully for user: ${input.email}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`Signup service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Authenticates a user with email and password.
   * If 2FA is enabled, returns a requires2fa flag instead of a token.
   * @param input Validated login payload
   */
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

      if (user.is2FAEnabled) {
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

  /**
   * Verifies a Supabase OAuth token and creates/retrieves the local user.
   * @param input Validated supabase token payload
   */
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
      const fullName = sbUser.user_metadata?.full_name ?? '';

      let user = await userRepo.findByEmail(email);
      if (!user) {
        logger.info(`Creating new user from Supabase login: ${email}`);
        try {
          user = await userRepo.create({
            email,
            name: fullName || 'User',
          });

          // Automatically create a default BudgetConfig for the new OAuth user
          const budgetRepo = new BudgetConfigRepositoryPg();
          await budgetRepo.upsertByUserId(user.id, {
            netSalary: 2500000, // Default ₱25,000.00 (in cents)
            needsRate: 0.50,
            wantsRate: 0.30,
            savingsRate: 0.10,
            investmentsRate: 0.10,
            cashAmount: 0,
          });
        } catch (dbError: any) {
          if (dbError.code === 'P2002') {
            logger.info(`Concurrent user creation detected for ${email}, retrieving existing user.`);
            user = await userRepo.findByEmail(email);
            if (!user) throw dbError;
          } else {
            throw dbError;
          }
        }
      }

      await userRepo.update(user.id, { lastActiveAt: new Date() });

      if (user.is2FAEnabled) {
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

  /**
   * Generates a new TOTP secret and otpauth URI for QR code display.
   * Stores the secret on the user record (not yet enabled until verified).
   * @param userId Authenticated user's ID from JWT
   */
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

  /**
   * Verifies a TOTP token against the user's secret and enables 2FA.
   * @param input Validated 2FA verification payload
   */
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

      await userRepo.update(user.id, { is2FAEnabled: true });

      logger.info(`verifyAndEnable2fa service completed successfully for userId: ${input.userId}`);
      return ok(true);
    } catch (error) {
      logger.error(`verifyAndEnable2fa service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Completes login for a 2FA-enabled user by verifying the TOTP token.
   * @param input Validated 2FA login payload
   */
  static async loginWith2fa(
    input: z.infer<typeof verify2faSchema>['body'],
  ): Promise<Result<{ user: any; token: string }, 'USER_NOT_FOUND' | 'INVALID_TOKEN' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing loginWith2fa service for userId: ${input.userId}`);
      const user = await userRepo.findById(input.userId);
      if (!user || !user.twoFactorSecret || !user.is2FAEnabled) {
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

  /**
   * Generates a random biometric key, hashes it with bcrypt, and stores
   * the hash on the user record. The raw key is returned once for the
   * mobile device to store in its secure enclave (expo-secure-store).
   * @param userId Authenticated user's ID from JWT
   */
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

  /**
   * Disables biometrics for the authenticated user and clears the biometric key hash.
   * @param userId Authenticated user's ID
   */
  static async disableBiometrics(
    userId: string,
  ): Promise<Result<boolean, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing disableBiometrics service for userId: ${userId}`);
      const user = await userRepo.findById(userId);
      if (!user) {
        logger.warn(`disableBiometrics failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      await userRepo.update(userId, {
        biometricsEnabled: false,
        biometricKeyHash: null,
      });

      logger.info(`disableBiometrics service completed successfully for userId: ${userId}`);
      return ok(true);
    } catch (error) {
      logger.error(`disableBiometrics service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Disables two-factor authentication (2FA) for the user and clears the 2FA secret.
   * @param userId Authenticated user's ID
   */
  static async disable2fa(
    userId: string,
  ): Promise<Result<boolean, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing disable2fa service for userId: ${userId}`);
      const user = await userRepo.findById(userId);
      if (!user) {
        logger.warn(`disable2fa failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      await userRepo.update(userId, {
        is2FAEnabled: false,
        twoFactorSecret: null,
      });

      logger.info(`disable2fa service completed successfully for userId: ${userId}`);
      return ok(true);
    } catch (error) {
      logger.error(`disable2fa service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }


  /**
   * Authenticates a user via biometric key comparison against the stored hash.
   * @param input Validated biometric login payload
   */
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

      const token = this.generateToken(user.id, user.email, user.is2FAEnabled);
      logger.info(`biometricLogin service completed successfully for userId: ${input.userId}`);
      return ok({ user, token });
    } catch (error) {
      logger.error(`biometricLogin service DB_ERROR for userId ${input.userId}:`, error);
      return err('DB_ERROR');
    }
  }

  // ── Password Reset ─────────────────────────────────────────────────────────

  /**
   * Generates a 6-digit OTP for password reset and stores it on the user.
   * Returns success regardless of whether the email exists (prevents enumeration).
   * @param input Validated forgot-password payload
   */
  static async forgotPassword(
    input: z.infer<typeof forgotPasswordSchema>['body'],
  ): Promise<Result<{ success: boolean }, 'DB_ERROR'>> {
    try {
      logger.info(`Executing forgotPassword service for email: ${input.email}`);
      const user = await userRepo.findByEmail(input.email);
      if (!user) {
        // Return ok to prevent user enumeration
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

      // Log OTP to console for development use
      logger.info(`[PASSWORD RESET OTP] OTP for ${input.email} is ${otp}`);

      return ok({ success: true });
    } catch (error) {
      logger.error(`forgotPassword service DB_ERROR for email ${input.email}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Verifies the OTP and resets the user's password.
   * @param input Validated reset-password payload
   */
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

  /**
   * Generates a signed JWT with the user's identity and 2FA verification state.
   * @param id User ID
   * @param email User email
   * @param is2FAVerified Whether 2FA was verified in this session
   */
  private static generateToken(id: string, email: string, is2FAVerified: boolean): string {
    return jwt.sign({ id, email, is2FAVerified }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }
}
