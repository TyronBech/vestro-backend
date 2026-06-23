import { CoreNetwork } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ICoreNetworkRepository, CreateCoreNetworkDto, UpdateCoreNetworkDto } from '../../domain/core-network/core-network.repository';

/**
 * Prisma-backed implementation of the CoreNetwork repository.
 */
export class CoreNetworkRepositoryPg
  extends BaseRepositoryPg<CoreNetwork, CreateCoreNetworkDto, UpdateCoreNetworkDto>
  implements ICoreNetworkRepository
{
  constructor() {
    super('coreNetwork');
  }

  async findByUserId(userId: string): Promise<CoreNetwork[]> {
    return this.db.coreNetwork.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByParentId(parentId: string): Promise<CoreNetwork[]> {
    return this.db.coreNetwork.findMany({
      where: { parentId },
      orderBy: { percentage: 'desc' },
    });
  }

  async findRootNodes(userId: string): Promise<CoreNetwork[]> {
    return this.db.coreNetwork.findMany({
      where: { userId, parentId: null },
      orderBy: { percentage: 'desc' },
    });
  }
}
