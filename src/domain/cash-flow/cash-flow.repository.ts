import { CashFlow, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateCashFlowDto = Prisma.CashFlowUncheckedCreateInput;
export type UpdateCashFlowDto = Prisma.CashFlowUncheckedUpdateInput;

/**
 * Domain interface for CashFlow persistence operations.
 */
export interface ICashFlowRepository extends IBaseRepository<CashFlow, CreateCashFlowDto, UpdateCashFlowDto> {
  /** Returns all cash flows belonging to a user, typically ordered by latest first. */
  findByUserId(userId: string): Promise<CashFlow[]>;

  /** Returns all cash flows for a specific core network. */
  findByCoreNetworkId(coreNetworkId: string): Promise<CashFlow[]>;

  /** 
   * Atomically creates a CashFlow and updates both CoreNetwork and MacroAsset balances. 
   * Positive amount increases balances, negative decreases them.
   */
  createWithBalanceUpdate(data: CreateCashFlowDto, signedAmount: number, macroAssetId: string): Promise<CashFlow>;
}
