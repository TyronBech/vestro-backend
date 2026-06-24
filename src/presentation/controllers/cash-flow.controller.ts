import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CashFlowService } from '../../services/cash-flow.service';
import { logger } from '../../utils/logger';

export class CashFlowController {
  /**
   * GET /api/cash-flows
   * List all cash flows for the authenticated user.
   */
  static async listCashFlows(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.info(`[CashFlowController.listCashFlows] Request received for userId: ${userId}`);

    const result = await CashFlowService.listCashFlows(userId);

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    res.status(500).json({ error: 'Internal Server Error', message: result.error });
  }

  /**
   * POST /api/cash-flows
   * Creates a cash flow (inflow/outflow) and automatically updates 
   * the CoreNetwork and MacroAsset balances.
   */
  static async createCashFlow(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { coreNetworkId, amount, type, notes } = req.body;

    logger.info(`[CashFlowController.createCashFlow] Request received for userId: ${userId}, coreNetworkId: ${coreNetworkId}`);

    const result = await CashFlowService.createCashFlow(userId, {
      coreNetworkId,
      amount,
      type,
      notes,
    });

    if (result.ok) {
      res.status(201).json({ data: result.value });
      return;
    }

    switch (result.error) {
      case 'NETWORK_NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Core network not found or does not belong to you' });
        break;
      case 'INVALID_AMOUNT':
        res.status(400).json({ error: 'Bad Request', message: 'Amount must be greater than 0' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create cash flow' });
        break;
    }
  }
}
