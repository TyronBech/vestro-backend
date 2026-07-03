import { Response } from 'express';
import { CreditCardService } from '../../services/credit-card.service';
import { logger } from '../../utils/logger';

export class CreditCardController {
  /** GET /credit-cards — list all cards */
  static async listCards(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`listCards request received for user: ${req.user?.email}`);
    const result = await CreditCardService.listCards(userId);
    if (!result.ok) {
      logger.error(`listCards failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to list cards' }] });
      return;
    }
    logger.info(`listCards request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /credit-cards — add a card */
  static async addCard(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`addCard request received for user: ${req.user?.email}`);
    const result = await CreditCardService.addCard(userId, req.body);
    if (!result.ok) {
      logger.error(`addCard failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to add card' }] });
      return;
    }
    logger.info(`addCard request successful for user: ${req.user?.email}`);
    res.status(201).json({ data: result.value });
  }

  /** PATCH /credit-cards/:id — update a card */
  static async updateCard(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`updateCard request received for user: ${req.user?.email}, cardId: ${req.params.id}`);
    const result = await CreditCardService.updateCard(userId, req.params.id, req.body);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`updateCard failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to update card' }] });
      return;
    }
    logger.info(`updateCard request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** DELETE /credit-cards/:id — delete a card */
  static async deleteCard(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`deleteCard request received for user: ${req.user?.email}, cardId: ${req.params.id}`);
    const result = await CreditCardService.deleteCard(userId, req.params.id);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`deleteCard failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to delete card' }] });
      return;
    }
    logger.info(`deleteCard request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: { success: true } });
  }

  /** POST /credit-cards/:id/spend — record a spend */
  static async recordSpend(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`recordSpend request received for user: ${req.user?.email}, cardId: ${req.params.id}`);
    const result = await CreditCardService.recordSpend(userId, req.params.id, req.body.amount);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`recordSpend failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to record spend' }] });
      return;
    }
    logger.info(`recordSpend request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /credit-cards/:id/mid-cycle-payment — record a mid-cycle payment */
  static async recordMidCyclePayment(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`recordMidCyclePayment request received for user: ${req.user?.email}, cardId: ${req.params.id}`);
    const result = await CreditCardService.recordMidCyclePayment(userId, req.params.id, req.body.amount);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`recordMidCyclePayment failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to record payment' }] });
      return;
    }
    logger.info(`recordMidCyclePayment request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** POST /credit-cards/:id/reset — reset a billing cycle */
  static async resetCycle(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`resetCycle request received for user: ${req.user?.email}, cardId: ${req.params.id}`);
    const result = await CreditCardService.resetCycle(userId, req.params.id);
    if (!result.ok) {
      const status = result.error === 'NOT_FOUND' ? 404 : 500;
      logger.error(`resetCycle failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to reset credit card' }] });
      return;
    }
    logger.info(`resetCycle request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }

  /** GET /credit-cards/shield-status — Credit Shield pipeline B */
  static async getShieldStatus(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    logger.info(`getShieldStatus request received for user: ${req.user?.email}`);
    const result = await CreditCardService.getCreditShieldStatus(userId);
    if (!result.ok) {
      logger.error(`getShieldStatus failed for user: ${req.user?.email}, Error: ${result.error}`);
      res.status(500).json({ errors: [{ code: result.error, message: 'Failed to get shield status' }] });
      return;
    }
    logger.info(`getShieldStatus request successful for user: ${req.user?.email}`);
    res.status(200).json({ data: result.value });
  }
}
