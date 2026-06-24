import { CashFlow } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ICashFlowRepository, CreateCashFlowDto, UpdateCashFlowDto } from '../../domain/cash-flow/cash-flow.repository';

/**
 * Prisma-backed implementation of the CashFlow repository.
 */
export class CashFlowRepositoryPg
  extends BaseRepositoryPg<CashFlow, CreateCashFlowDto, UpdateCashFlowDto>
  implements ICashFlowRepository
{
  constructor() {
    super('cashFlow');
  }

  async findByUserId(userId: string): Promise<CashFlow[]> {
    return this.db.cashFlow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        coreNetwork: true,
      }
    });
  }

  async findByCoreNetworkId(coreNetworkId: string): Promise<CashFlow[]> {
    return this.db.cashFlow.findMany({
      where: { coreNetworkId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atomically creates a CashFlow log and updates the CoreNetwork and MacroAsset balances.
   * This ensures all three entities remain synchronized.
   */
  async createWithBalanceUpdate(
    data: CreateCashFlowDto,
    signedAmount: number,
    macroAssetId: string
  ): Promise<CashFlow> {
    return this.db.$transaction(async (tx) => {
      // 1. Create the CashFlow record
      const cashFlow = await tx.cashFlow.create({
        data,
      });

      // 2. Increment CoreNetwork balance
      await tx.coreNetwork.update({
        where: { id: data.coreNetworkId },
        data: { balance: { increment: signedAmount } },
      });

      // 3. Increment MacroAsset balance
      await tx.macroAsset.update({
        where: { id: macroAssetId },
        data: { balance: { increment: signedAmount } },
      });

      return cashFlow;
    });
  }
}
