import { Result, ok, err } from '../utils/result';
import { SweepLogRepositoryPg } from '../infrastructure/db/sweep-log.repository.pg';
import { MacroAssetRepositoryPg } from '../infrastructure/db/macro-asset.repository.pg';
import { prisma } from '../infrastructure/db/prisma.client';
import { logger } from '../utils/logger';

const sweepLogRepo = new SweepLogRepositoryPg();
const macroAssetRepo = new MacroAssetRepositoryPg();

/** Shape of the sweep readiness check response. */
interface SweepReadiness {
  isReady: boolean;
  sourceAsset: {
    id: string;
    bankName: string;
    purpose: string;
    balance: number;
  } | null;
  availableToSweep: number;
  message: string;
}

export class SweepService {
  /**
   * Pipeline C — Sweep Readiness Check.
   *
   * Reads the live balance of the GoTyme Wants sandbox asset.
   * If balance > 0, the sweep is ready and the amount is flagged
   * as "unspent lifestyle leakage."
   *
   * @param userId Authenticated user's ID from JWT
   */
  static async getSweepReadiness(
    userId: string,
  ): Promise<Result<SweepReadiness, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getSweepReadiness service for userId: ${userId}`);
      const assets = await macroAssetRepo.findByUserId(userId);

      // Find the GoTyme Wants sandbox — match by purpose containing "Wants" (case-insensitive)
      const wantsAsset = assets.find(
        (a) => a.purpose.toLowerCase().includes('wants') && a.bankName.toUpperCase().includes('GOTYME'),
      );

      if (!wantsAsset || wantsAsset.balance <= 0) {
        logger.info(`getSweepReadiness: No sweep available for userId: ${userId}`);
        return ok({
          isReady: false,
          sourceAsset: wantsAsset ? {
            id: wantsAsset.id,
            bankName: wantsAsset.bankName,
            purpose: wantsAsset.purpose,
            balance: wantsAsset.balance,
          } : null,
          availableToSweep: 0,
          message: wantsAsset
            ? 'GoTyme Wants sandbox is already at ₱0. No sweep needed.'
            : 'No GoTyme Wants sandbox found. Create a macro asset first.',
        });
      }

      logger.info(`getSweepReadiness: Sweep ready for userId: ${userId}, amount: ${wantsAsset.balance}`);
      return ok({
        isReady: true,
        sourceAsset: {
          id: wantsAsset.id,
          bankName: wantsAsset.bankName,
          purpose: wantsAsset.purpose,
          balance: wantsAsset.balance,
        },
        availableToSweep: wantsAsset.balance,
        message: `₱${wantsAsset.balance.toFixed(2)} of unspent lifestyle cash detected. Ready to sweep.`,
      });
    } catch (error) {
      logger.error(`getSweepReadiness service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Pipeline C — Execute Sweep.
   *
   * Atomically:
   * 1. Logs the sweep to SweepLog
   * 2. Zeroes out the GoTyme Wants sandbox balance
   * 3. Increments the target vault balance (if it exists as a MacroAsset)
   *
   * Uses a Prisma transaction to ensure all three operations succeed or fail together.
   *
   * @param userId Authenticated user's ID from JWT
   * @param targetVault Name of the destination vault (e.g., "MariBank" or "BPI")
   * @param notes Optional notes about the sweep
   */
  static async executeSweep(
    userId: string,
    targetVault: string,
    notes?: string,
  ): Promise<Result<any, 'NO_SWEEP_AVAILABLE' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing executeSweep service for userId: ${userId}, targetVault: ${targetVault}`);

      const assets = await macroAssetRepo.findByUserId(userId);
      const wantsAsset = assets.find(
        (a) => a.purpose.toLowerCase().includes('wants') && a.bankName.toUpperCase().includes('GOTYME'),
      );

      if (!wantsAsset || wantsAsset.balance <= 0) {
        logger.warn(`executeSweep failed: No sweep available for userId: ${userId}`);
        return err('NO_SWEEP_AVAILABLE');
      }

      const sweepAmount = wantsAsset.balance;

      // Find the target vault asset (if it exists)
      const targetAsset = assets.find(
        (a) => a.bankName.toUpperCase().includes(targetVault.toUpperCase()),
      );

      // Execute atomically within a Prisma transaction
      const sweepLog = await prisma.$transaction(async (tx) => {
        // 1. Log the sweep
        const log = await tx.sweepLog.create({
          data: {
            userId,
            amount: sweepAmount,
            targetVault,
            notes,
          },
        });

        // 2. Zero out the Wants sandbox
        await tx.macroAsset.update({
          where: { id: wantsAsset.id },
          data: { balance: 0 },
        });

        // 3. Increment target vault balance (if it exists as a tracked asset)
        if (targetAsset) {
          await tx.macroAsset.update({
            where: { id: targetAsset.id },
            data: { balance: { increment: sweepAmount } },
          });
        }

        return log;
      });

      logger.info(`executeSweep service completed successfully for userId: ${userId}, sweepLogId: ${sweepLog.id}, amount: ${sweepAmount}`);
      return ok({
        sweepLog,
        amountSwept: sweepAmount,
        targetVault,
        sourceZeroed: true,
        targetUpdated: !!targetAsset,
      });
    } catch (error) {
      logger.error(`executeSweep service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Returns the full sweep history for a user, ordered newest first.
   * @param userId Authenticated user's ID from JWT
   */
  static async listSweepHistory(
    userId: string,
  ): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listSweepHistory service for userId: ${userId}`);
      const logs = await sweepLogRepo.findByUserId(userId);
      logger.info(`listSweepHistory service completed successfully for userId: ${userId}, count: ${logs.length}`);
      return ok(logs);
    } catch (error) {
      logger.error(`listSweepHistory service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
