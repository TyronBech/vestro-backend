import { Response } from 'express';
import { MacroAssetService } from '../../services/macro-asset.service';
import { logger } from '../../utils/logger';

export class MacroAssetController {
  /** GET /macro-assets — list all assets */
  static async listAssets(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`listAssets request received for user: ${req.user?.email}`);
    const result = await MacroAssetService.listAssets(userId);
    if (!result.ok) {
      logger.error(`listAssets failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list assets' }] });
      return;
    }
    logger.info(`listAssets request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /macro-assets — add an asset */
  static async addAsset(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`addAsset request received for user: ${req.user?.email}`);
    const result = await MacroAssetService.addAsset(userId, req.body);
    if (!result.ok) {
      logger.error(`addAsset failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to add asset' }] });
      return;
    }
    logger.info(`addAsset request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  /** PATCH /macro-assets/:id — update an asset */
  static async updateAsset(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`updateAsset request received for user: ${req.user?.email}, assetId: ${req.params.id}`);
    const result = await MacroAssetService.updateAsset(userId, req.params.id, req.body);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`updateAsset failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to update asset' }] });
      return;
    }
    logger.info(`updateAsset request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** DELETE /macro-assets/:id — delete an asset */
  static async deleteAsset(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`deleteAsset request received for user: ${req.user?.email}, assetId: ${req.params.id}`);
    const result = await MacroAssetService.deleteAsset(userId, req.params.id);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`deleteAsset failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to delete asset' }] });
      return;
    }
    logger.info(`deleteAsset request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: { success: true } });
  }
}
