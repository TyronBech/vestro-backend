import { Result, ok, err } from '../utils/result';
import { CashFlowRepositoryPg } from '../infrastructure/db/cash-flow.repository.pg';
import { CoreNetworkRepositoryPg } from '../infrastructure/db/core-network.repository.pg';
import { logger } from '../utils/logger';
import { CashFlowType } from '@prisma/client';

const cashFlowRepo = new CashFlowRepositoryPg();
const networkRepo = new CoreNetworkRepositoryPg();

export class CashFlowService {
  /**
   * List all cash flows for a user.
   */
  static async listCashFlows(userId: string): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listCashFlows service for userId: ${userId}`);
      const cashFlows = await cashFlowRepo.findByUserId(userId);
      return ok(cashFlows);
    } catch (error) {
      logger.error(`listCashFlows service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Adds a new CashFlow record and automatically updates the balances
   * for the CoreNetwork and its parent MacroAsset.
   */
  static async createCashFlow(
    userId: string,
    data: {
      coreNetworkId: string;
      amount: number;
      type: CashFlowType;
      notes?: string;
    }
  ): Promise<Result<any, 'NETWORK_NOT_FOUND' | 'INVALID_AMOUNT' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing createCashFlow service for userId: ${userId}, coreNetworkId: ${data.coreNetworkId}`);
      
      if (data.amount <= 0) {
        return err('INVALID_AMOUNT');
      }

      // Ensure the CoreNetwork exists and belongs to the user
      const network = await networkRepo.findById(data.coreNetworkId);
      if (!network || network.userId !== userId) {
        return err('NETWORK_NOT_FOUND');
      }

      // Calculate signed amount for the balance update
      const signedAmount = data.type === 'INFLOW' ? data.amount : -data.amount;

      // The createWithBalanceUpdate handles the transaction across CashFlow, CoreNetwork, and MacroAsset
      const cashFlow = await cashFlowRepo.createWithBalanceUpdate(
        {
          userId,
          coreNetworkId: data.coreNetworkId,
          amount: data.amount, // Raw amount is always stored as positive in CashFlow
          type: data.type,
          notes: data.notes ?? null,
        },
        signedAmount,
        network.macroAssetId
      );

      logger.info(`createCashFlow service completed successfully for userId: ${userId}, cashFlowId: ${cashFlow.id}`);
      return ok(cashFlow);
    } catch (error) {
      logger.error(`createCashFlow service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
