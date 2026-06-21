import { Result, ok, err } from '../utils/result';
import { MacroAssetRepositoryPg } from '../infrastructure/db/macro-asset.repository.pg';
import { logger } from '../utils/logger';

const assetRepo = new MacroAssetRepositoryPg();

export class MacroAssetService {
  /**
   * Returns all macro asset buckets for a user.
   * @param userId Authenticated user's ID from JWT
   */
  static async listAssets(
    userId: string,
  ): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listAssets service for userId: ${userId}`);
      const assets = await assetRepo.findByUserId(userId);
      logger.info(`listAssets service completed successfully for userId: ${userId}, count: ${assets.length}`);
      return ok(assets);
    } catch (error) {
      logger.error(`listAssets service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Adds a new macro asset bucket for a user.
   * @param userId Authenticated user's ID from JWT
   * @param data Validated macro asset creation payload
   */
  static async addAsset(
    userId: string,
    data: {
      bankName: string;
      purpose: string;
      balance?: number;
      targetGoal?: number;
    },
  ): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing addAsset service for userId: ${userId}, bankName: ${data.bankName}`);
      const asset = await assetRepo.create({
        userId,
        bankName: data.bankName,
        purpose: data.purpose,
        balance: data.balance ?? 0,
        targetGoal: data.targetGoal,
      });
      logger.info(`addAsset service completed successfully for userId: ${userId}, assetId: ${asset.id}`);
      return ok(asset);
    } catch (error) {
      logger.error(`addAsset service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Updates an existing macro asset.
   * Verifies ownership before updating.
   * @param userId Authenticated user's ID from JWT
   * @param assetId Macro asset ID
   * @param data Partial update payload
   */
  static async updateAsset(
    userId: string,
    assetId: string,
    data: {
      bankName?: string;
      purpose?: string;
      balance?: number;
      targetGoal?: number | null;
    },
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateAsset service for userId: ${userId}, assetId: ${assetId}`);
      const existing = await assetRepo.findById(assetId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`updateAsset failed: Asset not found or ownership mismatch for assetId: ${assetId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      const updated = await assetRepo.update(assetId, data);
      logger.info(`updateAsset service completed successfully for userId: ${userId}, assetId: ${assetId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`updateAsset service DB_ERROR for userId ${userId}, assetId ${assetId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Deletes a macro asset.
   * Verifies ownership before deleting.
   * @param userId Authenticated user's ID from JWT
   * @param assetId Macro asset ID
   */
  static async deleteAsset(
    userId: string,
    assetId: string,
  ): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing deleteAsset service for userId: ${userId}, assetId: ${assetId}`);
      const existing = await assetRepo.findById(assetId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`deleteAsset failed: Asset not found or ownership mismatch for assetId: ${assetId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      await assetRepo.delete(assetId);
      logger.info(`deleteAsset service completed successfully for userId: ${userId}, assetId: ${assetId}`);
      return ok(true);
    } catch (error) {
      logger.error(`deleteAsset service DB_ERROR for userId ${userId}, assetId ${assetId}:`, error);
      return err('DB_ERROR');
    }
  }
}
