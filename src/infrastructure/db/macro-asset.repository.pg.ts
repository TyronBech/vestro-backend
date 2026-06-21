import { MacroAsset } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IMacroAssetRepository, CreateMacroAssetDto, UpdateMacroAssetDto } from '../../domain/macro-asset/macro-asset.repository';

/**
 * Prisma-backed implementation of the MacroAsset repository.
 */
export class MacroAssetRepositoryPg
  extends BaseRepositoryPg<MacroAsset, CreateMacroAssetDto, UpdateMacroAssetDto>
  implements IMacroAssetRepository
{
  constructor() {
    super('macroAsset');
  }

  async findByUserId(userId: string): Promise<MacroAsset[]> {
    return this.db.macroAsset.findMany({
      where: { userId },
      orderBy: { bankName: 'asc' },
    });
  }

  async updateBalance(assetId: string, newBalance: number): Promise<MacroAsset> {
    return this.db.macroAsset.update({
      where: { id: assetId },
      data: { balance: newBalance },
    });
  }

  async incrementBalance(assetId: string, amount: number): Promise<MacroAsset> {
    return this.db.macroAsset.update({
      where: { id: assetId },
      data: { balance: { increment: amount } },
    });
  }
}
