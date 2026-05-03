import { Response } from 'express';
import { TransactionService } from '../../services/transaction.service';

export class TransactionController {
  static async addTransaction(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await TransactionService.addTransaction({ ...req.body, userId });
    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to add transaction' }] });
      return;
    }
    res.status(201).json({ data: result.value });
  }

  static async listTransactions(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    const result = await TransactionService.listTransactions(userId);
    if (!result.ok) {
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list transactions' }] });
      return;
    }
    res.status(200).json({ data: result.value });
  }
}
