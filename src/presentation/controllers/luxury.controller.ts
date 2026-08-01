import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { LuxuryService } from '../../services/luxury.service';
import { logger } from '../../utils/logger';

export class LuxuryController {
  /**
   * GET /api/luxuries
   * List all luxury items for authenticated user.
   */
  static async listLuxuryItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.info(`[LuxuryController.listLuxuryItems] Request for userId: ${userId}`);

    const result = await LuxuryService.listLuxuryItems(userId);

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    res.status(500).json({ error: 'Internal Server Error', message: result.error });
  }

  /**
   * POST /api/luxuries
   * Create a new luxury wishlist item.
   */
  static async createLuxuryItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { name, category, price, description, priority, targetDate, status } = req.body;

    logger.info(`[LuxuryController.createLuxuryItem] Request for userId: ${userId}, name: ${name}`);

    const result = await LuxuryService.createLuxuryItem(userId, {
      name,
      category,
      price,
      description,
      priority,
      targetDate,
      status,
    });

    if (result.ok) {
      res.status(201).json({ data: result.value });
      return;
    }

    switch (result.error) {
      case 'INVALID_PRICE':
        res.status(400).json({ error: 'Bad Request', message: 'Price must be greater than 0' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create luxury item' });
        break;
    }
  }

  /**
   * PUT /api/luxuries/:id
   * Update a luxury item.
   */
  static async updateLuxuryItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const updateData = req.body;

    logger.info(`[LuxuryController.updateLuxuryItem] Request for userId: ${userId}, luxuryId: ${id}`);

    const result = await LuxuryService.updateLuxuryItem(userId, id, updateData);

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    switch (result.error) {
      case 'NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Luxury item not found' });
        break;
      case 'INVALID_PRICE':
        res.status(400).json({ error: 'Bad Request', message: 'Price must be greater than 0' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update luxury item' });
        break;
    }
  }

  /**
   * POST /api/luxuries/:id/purchase
   * Mark luxury item as PURCHASED and optionally link/create an OUTFLOW CashFlow.
   */
  static async markAsPurchased(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { purchasedAt, actualPrice, cashFlowId, createCashFlow } = req.body;

    logger.info(`[LuxuryController.markAsPurchased] Request for userId: ${userId}, luxuryId: ${id}`);

    const result = await LuxuryService.markAsPurchased(userId, id, {
      purchasedAt,
      actualPrice,
      cashFlowId,
      createCashFlow,
    });

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    switch (result.error) {
      case 'NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Luxury item not found' });
        break;
      case 'CASHFLOW_NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Target cash flow transaction not found' });
        break;
      case 'INFLOW_CANNOT_BE_LINKED_TO_LUXURY_PURCHASE':
        res.status(400).json({
          error: 'Bad Request',
          message: 'Inflow transactions cannot be linked to luxury purchases. Only OUTFLOW cash flows are valid.',
        });
        break;
      case 'NETWORK_NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Target core network account not found' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to complete purchase transaction' });
        break;
    }
  }

  /**
   * POST /api/luxuries/:id/cancel
   * Mark luxury item as CANCELLED (avoided impulse purchase).
   */
  static async markAsCancelled(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { cancelledAt, cancelReason } = req.body;

    logger.info(`[LuxuryController.markAsCancelled] Request for userId: ${userId}, luxuryId: ${id}`);

    const result = await LuxuryService.markAsCancelled(userId, id, {
      cancelledAt,
      cancelReason,
    });

    if (result.ok) {
      res.status(200).json({ data: result.value });
      return;
    }

    switch (result.error) {
      case 'NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Luxury item not found' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to cancel luxury item' });
        break;
    }
  }

  /**
   * DELETE /api/luxuries/:id
   * Delete luxury item.
   */
  static async deleteLuxuryItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const id = req.params.id as string;

    logger.info(`[LuxuryController.deleteLuxuryItem] Request for userId: ${userId}, luxuryId: ${id}`);

    const result = await LuxuryService.deleteLuxuryItem(userId, id);

    if (result.ok) {
      res.status(200).json({ message: 'Luxury item deleted successfully' });
      return;
    }

    switch (result.error) {
      case 'NOT_FOUND':
        res.status(404).json({ error: 'Not Found', message: 'Luxury item not found' });
        break;
      case 'DB_ERROR':
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete luxury item' });
        break;
    }
  }
}
