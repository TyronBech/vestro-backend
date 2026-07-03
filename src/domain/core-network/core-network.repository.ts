import { CoreNetwork, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateCoreNetworkDto = Prisma.CoreNetworkUncheckedCreateInput;
export type UpdateCoreNetworkDto = Prisma.CoreNetworkUncheckedUpdateInput;

/**
 * Domain interface for CoreNetwork persistence operations.
 * CoreNetwork represents the routing tree nodes for macro assets.
 */
export interface ICoreNetworkRepository extends IBaseRepository<CoreNetwork, CreateCoreNetworkDto, UpdateCoreNetworkDto> {
  /** Returns all routing nodes belonging to a user. */
  findByUserId(userId: string): Promise<CoreNetwork[]>;

  /** Returns all child nodes belonging to a specific parent node. */
  findByParentId(parentId: string): Promise<CoreNetwork[]>;

  /** Returns all root nodes (nodes without a parent) for a user. */
  findRootNodes(userId: string): Promise<CoreNetwork[]>;

  /** Safely increments (or decrements if negative) the node's balance. */
  updateBalance(nodeId: string, amount: number): Promise<CoreNetwork>;
}
