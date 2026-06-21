import { Result, ok, err } from '../utils/result';
import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { z } from 'zod';
import { updateProfileSchema } from '../presentation/schemas/user.schema';
import { logger } from '../utils/logger';

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];

const userRepo = new UserRepositoryPg();

/**
 * Service for reading and updating the authenticated user's profile.
 * Sensitive fields (passwordHash, biometricKeyHash, twoFactorSecret, etc.)
 * are explicitly stripped from responses.
 */
export class ProfileService {
  /**
   * Fetches the authenticated user's profile.
   * Strips sensitive fields before returning.
   * @param userId Authenticated user's ID from JWT
   */
  static async getProfile(
    userId: string,
  ): Promise<Result<any, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing getProfile service for userId: ${userId}`);
      const user = await userRepo.findById(userId);

      if (!user) {
        logger.warn(`getProfile failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      logger.info(`getProfile service completed successfully for userId: ${userId}`);
      return ok(this.toSafeProfile(user));
    } catch (error) {
      logger.error(`getProfile service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Partially updates the authenticated user's profile.
   * Only whitelisted fields from UpdateProfileInput are ever written.
   * @param userId Authenticated user's ID from JWT
   * @param input Validated payload from the validate(updateProfileSchema) middleware
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<Result<any, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateProfile service for userId: ${userId}`);
      const exists = await userRepo.findById(userId);
      if (!exists) {
        logger.warn(`updateProfile failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      await userRepo.update(userId, {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.spendingLimit !== undefined && { spendingLimit: input.spendingLimit }),
        ...(input.panicModeEnabled !== undefined && { panicModeEnabled: input.panicModeEnabled }),
      });

      // Re-fetch to return the safe projection
      const user = await userRepo.findById(userId);
      logger.info(`updateProfile service completed successfully for userId: ${userId}`);
      return ok(this.toSafeProfile(user));
    } catch (error) {
      logger.error(`updateProfile service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Strips sensitive fields from a User entity before returning to the client.
   * Never exposes password hashes, biometric key hashes, or 2FA secrets.
   */
  private static toSafeProfile(user: any): Record<string, unknown> {
    const {
      passwordHash: _ph,
      biometricKeyHash: _bkh,
      twoFactorSecret: _tfs,
      resetPasswordToken: _rpt,
      resetPasswordExpires: _rpe,
      ...safeProfile
    } = user;
    return safeProfile;
  }
}
