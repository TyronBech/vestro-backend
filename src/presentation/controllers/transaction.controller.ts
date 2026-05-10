import { Response } from 'express';
import { TransactionService } from '../../services/transaction.service';
import { logger } from '../../utils/logger';

export class TransactionController {
  static async addTransaction(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`addTransaction request received for user: ${req.user?.email}`);
    const result = await TransactionService.addTransaction({ ...req.body, userId });
    if (!result.ok) {
      logger.error(`addTransaction failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to add transaction' }] });
      return;
    }
    logger.info(`addTransaction request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  static async listTransactions(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    logger.info(`listTransactions request received for user: ${req.user?.email}`);
    const result = await TransactionService.listTransactions(userId);
    if (!result.ok) {
      logger.error(`listTransactions failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list transactions' }] });
      return;
    }
    logger.info(`listTransactions request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
