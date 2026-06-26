import { Result, ok, err } from '../utils/result';
import { CoreNetworkRepositoryPg } from '../infrastructure/db/core-network.repository.pg';
import { MacroAssetRepositoryPg } from '../infrastructure/db/macro-asset.repository.pg';
import { logger } from '../utils/logger';
import { CoreNetworkType } from '@prisma/client';

const networkRepo = new CoreNetworkRepositoryPg();
const assetRepo = new MacroAssetRepositoryPg();

export class CoreNetworkService {
  /**
   * Returns all routing tree nodes for a user.
   */
  static async listNetwork(userId: string): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listNetwork service for userId: ${userId}`);
      const nodes = await networkRepo.findByUserId(userId);
      return ok(nodes);
    } catch (error) {
      logger.error(`listNetwork service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Validates if a new percentage allocation is valid for the given tree level.
   * - Root Nodes (parentId == null): Total percentages <= 100
   * - Child Nodes: Total percentages <= parent's percentage
   */
  private static async validatePercentageConstraint(
    userId: string,
    parentId: string | null | undefined,
    requestedPercentage: number,
    excludeNodeId?: string,
  ): Promise<Result<boolean, 'PARENT_NOT_FOUND' | 'EXCEEDS_LIMIT' | 'DB_ERROR'>> {
    try {
      let maxAllowed = 100;
      let siblings: any[] = [];

      if (parentId) {
        // Child node validation
        const parent = await networkRepo.findById(parentId);
        if (!parent || parent.userId !== userId) {
          return err('PARENT_NOT_FOUND');
        }
        maxAllowed = parent.percentage;
        siblings = await networkRepo.findByParentId(parentId);
      } else {
        // Root node validation
        siblings = await networkRepo.findRootNodes(userId);
      }

      // Sum existing percentages, excluding the node being updated (if any)
      const currentSum = siblings.reduce((sum, node) => {
        if (excludeNodeId && node.id === excludeNodeId) return sum;
        return sum + node.percentage;
      }, 0);

      if (currentSum + requestedPercentage > maxAllowed) {
        return err('EXCEEDS_LIMIT');
      }

      return ok(true);
    } catch (error) {
      logger.error(`validatePercentageConstraint DB_ERROR:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Adds a new CoreNetwork routing node for a user.
   */
  static async addNode(
    userId: string,
    data: {
      macroAssetId: string;
      parentId?: string | null;
      name: string;
      description?: string;
      percentage: number;
      type?: CoreNetworkType | null;
    },
  ): Promise<Result<any, 'MACRO_ASSET_NOT_FOUND' | 'PARENT_NOT_FOUND' | 'EXCEEDS_LIMIT' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing addNode service for userId: ${userId}, name: ${data.name}`);
      
      // Ensure the MacroAsset exists and belongs to the user
      const asset = await assetRepo.findById(data.macroAssetId);
      if (!asset || asset.userId !== userId) {
        return err('MACRO_ASSET_NOT_FOUND');
      }

      // Validate percentage constraints
      const validationResult = await this.validatePercentageConstraint(
        userId,
        data.parentId,
        data.percentage,
      );

      if (!validationResult.ok) {
        return err(validationResult.error);
      }

      const node = await networkRepo.create({
        userId,
        macroAssetId: data.macroAssetId,
        parentId: data.parentId ?? null,
        name: data.name,
        description: data.description ?? null,
        percentage: data.percentage,
        type: data.type ?? null,
      });

      logger.info(`addNode service completed successfully for userId: ${userId}, nodeId: ${node.id}`);
      return ok(node);
    } catch (error) {
      logger.error(`addNode service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Updates an existing CoreNetwork node.
   */
  static async updateNode(
    userId: string,
    nodeId: string,
    data: {
      name?: string;
      description?: string;
      percentage?: number;
      type?: CoreNetworkType | null;
    },
  ): Promise<Result<any, 'NOT_FOUND' | 'EXCEEDS_LIMIT' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateNode service for userId: ${userId}, nodeId: ${nodeId}`);
      
      const existing = await networkRepo.findById(nodeId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      // If percentage is changing, validate constraints
      if (data.percentage !== undefined && data.percentage !== existing.percentage) {
        const validationResult = await this.validatePercentageConstraint(
          userId,
          existing.parentId,
          data.percentage,
          nodeId, // Exclude current node from sum
        );

        if (!validationResult.ok) {
          return err(validationResult.error as 'EXCEEDS_LIMIT' | 'DB_ERROR');
        }
      }

      const updated = await networkRepo.update(nodeId, data);
      logger.info(`updateNode service completed successfully for userId: ${userId}, nodeId: ${nodeId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`updateNode service DB_ERROR for userId ${userId}, nodeId ${nodeId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Deletes a CoreNetwork node (Cascade delete will remove its children automatically).
   */
  static async deleteNode(
    userId: string,
    nodeId: string,
  ): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing deleteNode service for userId: ${userId}, nodeId: ${nodeId}`);
      const existing = await networkRepo.findById(nodeId);
      if (!existing || existing.userId !== userId) {
        return err('NOT_FOUND');
      }

      await networkRepo.delete(nodeId);
      logger.info(`deleteNode service completed successfully for userId: ${userId}, nodeId: ${nodeId}`);
      return ok(true);
    } catch (error) {
      logger.error(`deleteNode service DB_ERROR for userId ${userId}, nodeId ${nodeId}:`, error);
      return err('DB_ERROR');
    }
  }
}
