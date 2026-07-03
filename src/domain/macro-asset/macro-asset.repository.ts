import { MacroAsset, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateMacroAssetDto = Prisma.MacroAssetUncheckedCreateInput;
export type UpdateMacroAssetDto = Prisma.MacroAssetUncheckedUpdateInput;

/**
 * Domain interface for MacroAsset persistence operations.
 * MacroAssets represent high-level bank bucket balances (1:N with User).
 */
export interface IMacroAssetRepository extends IBaseRepository<MacroAsset, CreateMacroAssetDto, UpdateMacroAssetDto> {
  /** Returns all macro assets belonging to a user. */
  findByUserId(userId: string): Promise<MacroAsset[]>;

  /** Atomically updates the balance of a macro asset. */
  updateBalance(assetId: string, newBalance: number): Promise<MacroAsset>;

  /** Atomically increments a macro asset's balance by the given amount. */
  incrementBalance(assetId: string, amount: number): Promise<MacroAsset>;
}
