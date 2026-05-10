import { Result, ok, err } from '../utils/result';
import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { z } from 'zod';
import { updateProfileSchema } from '../presentation/schemas/user.schema';

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
import { logger } from '../utils/logger';

const userRepo = new UserRepositoryPg();

/** Safe projection of user fields — never exposes secrets or hashes */
const PROFILE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  middleName: true,
  lastName: true,
  suffix: true,
  avatarUrl: true,
  currency: true,
  spendingLimit: true,
  biometricsEnabled: true,
  panicModeEnabled: true,
  twoFactorEnabled: true,
  lastActiveAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ProfileService {
  /**
   * Fetches the authenticated user's full profile.
   * Sensitive fields (passwordHash, biometricKeyHash, twoFactorSecret, etc.) are
   * deliberately excluded via the PROFILE_SELECT projection.
   * @param userId Authenticated user's ID from JWT
   */
  static async getProfile(
    userId: string,
  ): Promise<Result<any, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing getProfile service for userId: ${userId}`);
      const user = await userRepo.findByIdSelect(userId, PROFILE_SELECT);

      if (!user) {
        logger.warn(`getProfile failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }
      logger.info(`getProfile service completed successfully for userId: ${userId}`);
      return ok(user);
    } catch (error) {
      logger.error(`getProfile service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Partially updates the authenticated user's profile.
   * Only fields included in UpdateProfileInput (validated by Zod upstream) are
   * ever written — no arbitrary fields can sneak through.
   * The returned record uses the same safe PROFILE_SELECT projection.
   * @param userId Authenticated user's ID from JWT
   * @param input Validated payload from the `validate(updateProfileSchema)` middleware
   */
  static async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<Result<any, 'USER_NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateProfile service for userId: ${userId}`);
      const exists = await userRepo.findByIdSelect(userId, { id: true });
      if (!exists) {
        logger.warn(`updateProfile failed: User not found for userId: ${userId}`);
        return err('USER_NOT_FOUND');
      }

      const updated = await userRepo.update(userId, {
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.middleName !== undefined && { middleName: input.middleName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.suffix !== undefined && { suffix: input.suffix }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.spendingLimit !== undefined && { spendingLimit: input.spendingLimit }),
        ...(input.biometricsEnabled !== undefined && { biometricsEnabled: input.biometricsEnabled }),
        ...(input.panicModeEnabled !== undefined && { panicModeEnabled: input.panicModeEnabled }),
      });

      // Re-fetch with safe projection to exclude any sensitive fields from the response
      const user = await userRepo.findByIdSelect(userId, PROFILE_SELECT);
      logger.info(`updateProfile service completed successfully for userId: ${userId}`);
      return ok(user);
    } catch (error) {
      logger.error(`updateProfile service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
