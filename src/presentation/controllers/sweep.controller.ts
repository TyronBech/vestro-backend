import { Response } from 'express';
import { SweepService } from '../../services/sweep.service';
import { logger } from '../../utils/logger';

export class SweepController {
  /** GET /sweep/readiness — Pipeline C readiness check */
  static async getSweepReadiness(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getSweepReadiness request received for user: ${req.user?.email}`);
    const result = await SweepService.getSweepReadiness(userId);
    if (!result.ok) {
      logger.error(`getSweepReadiness failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to check sweep readiness' }] });
      return;
    }
    logger.info(`getSweepReadiness request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /sweep/execute — Execute Pipeline C sweep */
  static async executeSweep(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`executeSweep request received for user: ${req.user?.email}`);
    const result = await SweepService.executeSweep(userId, req.body.targetVault, req.body.notes);
    if (!result.ok) {
      const status = result.error === 'NO_SWEEP_AVAILABLE' ? 400 : 500;
      logger.error(`executeSweep failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to execute sweep' }] });
      return;
    }
    logger.info(`executeSweep request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /sweep/manual — Create manual/custom sweep log */
  static async createManualSweep(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`createManualSweep request received for user: ${req.user?.email}`);
    const { amount, coreNetworkId, notes, sweptAt } = req.body;
    const result = await SweepService.createManualSweep(userId, amount, coreNetworkId, notes, sweptAt);
    if (!result.ok) {
      logger.error(`createManualSweep failed for user: ${req.user?.email}, Error: ${result.error}`);
      const status = result.error === 'CORE_NETWORK_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to record manual sweep' }] });
      return;
    }
    logger.info(`createManualSweep request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  /** GET /sweep/history — List sweep history */
  static async listSweepHistory(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`listSweepHistory request received for user: ${req.user?.email}`);
    const result = await SweepService.listSweepHistory(userId);
    if (!result.ok) {
      logger.error(`listSweepHistory failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list sweep history' }] });
      return;
    }
    logger.info(`listSweepHistory request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
