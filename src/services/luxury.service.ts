import { Result, ok, err } from '../utils/result';
import { LuxuryRepositoryPg } from '../infrastructure/db/luxury.repository.pg';
import { CashFlowRepositoryPg } from '../infrastructure/db/cash-flow.repository.pg';
import { CashFlowService } from './cash-flow.service';
import { logger } from '../utils/logger';
import { LuxuryCategory, LuxuryPriority, LuxuryStatus } from '@prisma/client';

const luxuryRepo = new LuxuryRepositoryPg();
const cashFlowRepo = new CashFlowRepositoryPg();

export interface CreateLuxuryInput {
  name: string;
  category: LuxuryCategory;
  price: number; // In standard currency units (e.g. 8500.50 -> converts to 850050 cents)
  description?: string;
  priority: LuxuryPriority;
  targetDate?: Date | string;
  status: LuxuryStatus;
}

export interface UpdateLuxuryInput {
  name?: string;
  category?: LuxuryCategory;
  price?: number;
  description?: string;
  priority?: LuxuryPriority;
  targetDate?: Date | string | null;
  status?: LuxuryStatus;
}

export interface MarkAsPurchasedInput {
  purchasedAt: Date | string;
  actualPrice?: number;
  cashFlowId?: string;
  createCashFlow?: {
    coreNetworkId: string;
    notes?: string;
  };
}

export interface MarkAsCancelledInput {
  cancelledAt: Date | string;
  cancelReason: string;
}

export class LuxuryService {
  /**
   * List all luxury items for a user.
   */
  static async listLuxuryItems(userId: string): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listLuxuryItems service for userId: ${userId}`);
      const items = await luxuryRepo.findByUserId(userId);
      return ok(items);
    } catch (error) {
      logger.error(`listLuxuryItems service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Create a new luxury wishlist item.
   */
  static async createLuxuryItem(
    userId: string,
    data: CreateLuxuryInput
  ): Promise<Result<any, 'INVALID_PRICE' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing createLuxuryItem service for userId: ${userId}, name: ${data.name}`);

      if (data.price <= 0) {
        return err('INVALID_PRICE');
      }

      // Convert price in standard units to cents (e.g. ₱182.50 -> 18250 cents)
      const priceCents = Math.round(data.price * 100);

      const newItem = await luxuryRepo.create({
        userId,
        name: data.name.trim(),
        category: data.category,
        priceCents,
        description: data.description ? data.description.trim() : null,
        priority: data.priority,
        status: data.status,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      });

      logger.info(`createLuxuryItem created successfully with ID: ${newItem.id}`);
      return ok(newItem);
    } catch (error) {
      logger.error(`createLuxuryItem service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Update a luxury item.
   */
  static async updateLuxuryItem(
    userId: string,
    luxuryId: string,
    data: UpdateLuxuryInput
  ): Promise<Result<any, 'NOT_FOUND' | 'INVALID_PRICE' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateLuxuryItem service for userId: ${userId}, luxuryId: ${luxuryId}`);

      const existing = await luxuryRepo.findById(luxuryId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.category !== undefined) updateData.category = data.category;
      if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.status !== undefined) updateData.status = data.status;

      if (data.price !== undefined) {
        if (data.price <= 0) return err('INVALID_PRICE');
        updateData.priceCents = Math.round(data.price * 100);
      }

      if (data.targetDate !== undefined) {
        updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
      }

      const updated = await luxuryRepo.update(luxuryId, updateData);
      return ok(updated);
    } catch (error) {
      logger.error(`updateLuxuryItem service DB_ERROR for userId ${userId}, luxuryId ${luxuryId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Mark luxury item as PURCHASED and optionally link/create an OUTFLOW CashFlow.
   */
  static async markAsPurchased(
    userId: string,
    luxuryId: string,
    input: MarkAsPurchasedInput
  ): Promise<
    Result<
      any,
      | 'NOT_FOUND'
      | 'CASHFLOW_NOT_FOUND'
      | 'INFLOW_CANNOT_BE_LINKED_TO_LUXURY_PURCHASE'
      | 'NETWORK_NOT_FOUND'
      | 'DB_ERROR'
    >
  > {
    try {
      logger.info(`Executing markAsPurchased for userId: ${userId}, luxuryId: ${luxuryId}`);

      const existing = await luxuryRepo.findById(luxuryId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      let linkedCashFlowId: string | null = null;
      const finalPriceCents = input.actualPrice !== undefined ? Math.round(input.actualPrice * 100) : existing.priceCents;

      // 1. If linking an existing CashFlow
      if (input.cashFlowId) {
        const cashFlow = await cashFlowRepo.findById(input.cashFlowId);
        if (!cashFlow || cashFlow.userId !== userId) {
          return err('CASHFLOW_NOT_FOUND');
        }

        // VALIDATION RULE: ONLY OUTFLOW CashFlows can be linked to luxury purchases!
        if (cashFlow.type === 'INFLOW') {
          logger.warn(`Attempted to link INFLOW cashFlow ${input.cashFlowId} to luxury purchase ${luxuryId}`);
          return err('INFLOW_CANNOT_BE_LINKED_TO_LUXURY_PURCHASE');
        }

        linkedCashFlowId = cashFlow.id;
      }
      // 2. If creating a new OUTFLOW CashFlow
      else if (input.createCashFlow) {
        const amountInCurrency = finalPriceCents / 100;
        const cfResult = await CashFlowService.createCashFlow(userId, {
          coreNetworkId: input.createCashFlow.coreNetworkId,
          amount: amountInCurrency,
          type: 'OUTFLOW',
          notes: input.createCashFlow.notes ?? `Luxury Purchase: ${existing.name}`,
        });

        if (!cfResult.ok) {
          if (cfResult.error === 'NETWORK_NOT_FOUND') return err('NETWORK_NOT_FOUND');
          return err('DB_ERROR');
        }

        linkedCashFlowId = cfResult.value.id;
      }

      const updated = await luxuryRepo.update(luxuryId, {
        status: 'PURCHASED',
        purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : new Date(),
        priceCents: finalPriceCents,
        ...(linkedCashFlowId ? { cashFlowId: linkedCashFlowId } : {}),
      });

      logger.info(`markAsPurchased completed for luxuryId: ${luxuryId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`markAsPurchased DB_ERROR for userId ${userId}, luxuryId ${luxuryId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Mark luxury item as CANCELLED (avoided impulse purchase / money saved!).
   */
  static async markAsCancelled(
    userId: string,
    luxuryId: string,
    input: MarkAsCancelledInput
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing markAsCancelled for userId: ${userId}, luxuryId: ${luxuryId}`);

      const existing = await luxuryRepo.findById(luxuryId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      const updated = await luxuryRepo.update(luxuryId, {
        status: 'CANCELLED',
        cancelledAt: input.cancelledAt ? new Date(input.cancelledAt) : new Date(),
        cancelReason: input.cancelReason ? input.cancelReason.trim() : null,
      });

      logger.info(`markAsCancelled completed for luxuryId: ${luxuryId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`markAsCancelled DB_ERROR for userId ${userId}, luxuryId ${luxuryId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Delete a luxury item.
   */
  static async deleteLuxuryItem(
    userId: string,
    luxuryId: string
  ): Promise<Result<void, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing deleteLuxuryItem for userId: ${userId}, luxuryId: ${luxuryId}`);

      const existing = await luxuryRepo.findById(luxuryId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      await luxuryRepo.delete(luxuryId);
      return ok(undefined);
    } catch (error) {
      logger.error(`deleteLuxuryItem DB_ERROR for userId ${userId}, luxuryId ${luxuryId}:`, error);
      return err('DB_ERROR');
    }
  }
}
