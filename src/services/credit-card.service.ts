import { Result, ok, err } from '../utils/result';
import { CreditCardRepositoryPg } from '../infrastructure/db/credit-card.repository.pg';
import { logger } from '../utils/logger';

const cardRepo = new CreditCardRepositoryPg();

/** Credit utilization thresholds. */
const DANGER_THRESHOLD = 0.30; // 30% — warning fires
const SAFE_TARGET = 0.28;     // 28% — target after mid-cycle payment

/** Shape of the Credit Shield status response. */
interface CreditShieldStatus {
  cards: Array<{
    id: string;
    cardName: string;
    creditLimit: number;
    unbilledSpend: number;
    midCyclePaid: number;
    effectiveSpend: number;
    utilization: number;
    status: 'SAFE' | 'WARNING' | 'DANGER';
    suggestedPayment: number;
    message: string;
  }>;
  overallStatus: 'SAFE' | 'WARNING' | 'DANGER';
}

export class CreditCardService {
  /**
   * Returns all credit cards for a user.
   * @param userId Authenticated user's ID from JWT
   */
  static async listCards(
    userId: string,
  ): Promise<Result<any[], 'DB_ERROR'>> {
    try {
      logger.info(`Executing listCards service for userId: ${userId}`);
      const cards = await cardRepo.findByUserId(userId);
      logger.info(`listCards service completed successfully for userId: ${userId}, count: ${cards.length}`);
      return ok(cards);
    } catch (error) {
      logger.error(`listCards service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Adds a new credit card for a user.
   * @param userId Authenticated user's ID from JWT
   * @param data Validated credit card creation payload
   */
  static async addCard(
    userId: string,
    data: {
      cardName: string;
      creditLimit: number;
      statementCutoffDay: number;
      paymentDueDay: number;
      macroAssetId?: string | null;
    },
  ): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`Executing addCard service for userId: ${userId}, cardName: ${data.cardName}`);
      const card = await cardRepo.create({ userId, ...data });
      logger.info(`addCard service completed successfully for userId: ${userId}, cardId: ${card.id}`);
      return ok(card);
    } catch (error) {
      logger.error(`addCard service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Updates an existing credit card.
   * Verifies ownership before updating.
   * @param userId Authenticated user's ID from JWT
   * @param cardId Credit card ID
   * @param data Partial update payload
   */
  static async updateCard(
    userId: string,
    cardId: string,
    data: {
      cardName?: string;
      creditLimit?: number;
      statementCutoffDay?: number;
      paymentDueDay?: number;
      macroAssetId?: string | null;
    },
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing updateCard service for userId: ${userId}, cardId: ${cardId}`);
      const existing = await cardRepo.findById(cardId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`updateCard failed: Card not found or ownership mismatch for cardId: ${cardId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      const updated = await cardRepo.update(cardId, data);
      logger.info(`updateCard service completed successfully for userId: ${userId}, cardId: ${cardId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`updateCard service DB_ERROR for userId ${userId}, cardId ${cardId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Deletes a credit card.
   * Verifies ownership before deleting.
   * @param userId Authenticated user's ID from JWT
   * @param cardId Credit card ID
   */
  static async deleteCard(
    userId: string,
    cardId: string,
  ): Promise<Result<boolean, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing deleteCard service for userId: ${userId}, cardId: ${cardId}`);
      const existing = await cardRepo.findById(cardId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`deleteCard failed: Card not found or ownership mismatch for cardId: ${cardId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      await cardRepo.delete(cardId);
      logger.info(`deleteCard service completed successfully for userId: ${userId}, cardId: ${cardId}`);
      return ok(true);
    } catch (error) {
      logger.error(`deleteCard service DB_ERROR for userId ${userId}, cardId ${cardId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Records a spend event on a credit card by atomically incrementing unbilledSpend.
   * @param userId Authenticated user's ID from JWT
   * @param cardId Credit card ID
   * @param amount Spend amount
   */
  static async recordSpend(
    userId: string,
    cardId: string,
    amount: number,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing recordSpend service for userId: ${userId}, cardId: ${cardId}, amount: ${amount}`);
      const existing = await cardRepo.findById(cardId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`recordSpend failed: Card not found or ownership mismatch for cardId: ${cardId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      const updated = await cardRepo.incrementUnbilledSpend(cardId, amount);
      logger.info(`recordSpend service completed successfully for userId: ${userId}, cardId: ${cardId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`recordSpend service DB_ERROR for userId ${userId}, cardId ${cardId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Records a mid-cycle payment on a credit card to depress utilization.
   * @param userId Authenticated user's ID from JWT
   * @param cardId Credit card ID
   * @param amount Payment amount
   */
  static async recordMidCyclePayment(
    userId: string,
    cardId: string,
    amount: number,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing recordMidCyclePayment service for userId: ${userId}, cardId: ${cardId}, amount: ${amount}`);
      const existing = await cardRepo.findById(cardId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`recordMidCyclePayment failed: Card not found or ownership mismatch for cardId: ${cardId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      const updated = await cardRepo.incrementMidCyclePaid(cardId, amount);
      logger.info(`recordMidCyclePayment service completed successfully for userId: ${userId}, cardId: ${cardId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`recordMidCyclePayment service DB_ERROR for userId ${userId}, cardId ${cardId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Resets unbilledSpend and midCyclePaid to 0.
   * @param userId Authenticated user's ID from JWT
   * @param cardId Credit card ID
   */
  static async resetCycle(
    userId: string,
    cardId: string,
  ): Promise<Result<any, 'NOT_FOUND' | 'DB_ERROR'>> {
    try {
      logger.info(`Executing resetCycle service for userId: ${userId}, cardId: ${cardId}`);
      const existing = await cardRepo.findById(cardId);
      if (!existing || existing.userId !== userId) {
        logger.warn(`resetCycle failed: Card not found or ownership mismatch for cardId: ${cardId}, userId: ${userId}`);
        return err('NOT_FOUND');
      }

      const updated = await cardRepo.resetCycle(cardId);
      logger.info(`resetCycle service completed successfully for userId: ${userId}, cardId: ${cardId}`);
      return ok(updated);
    } catch (error) {
      logger.error(`resetCycle service DB_ERROR for userId ${userId}, cardId ${cardId}:`, error);
      return err('DB_ERROR');
    }
  }

  /**
   * Pipeline B — Credit Shield.
   *
   * Computes utilization for all of a user's credit cards and returns
   * status indicators with mid-cycle payment recommendations.
   *
   * Utilization formula: U = (unbilledSpend - midCyclePaid) / creditLimit × 100
   * Warning fires when U ≥ 30%.
   * Mid-cycle payment formula: P_mid = max(0, effectiveSpend - (creditLimit × 0.28))
   *
   * @param userId Authenticated user's ID from JWT
   */
  static async getCreditShieldStatus(
    userId: string,
  ): Promise<Result<CreditShieldStatus, 'DB_ERROR'>> {
    try {
      logger.info(`Executing getCreditShieldStatus service for userId: ${userId}`);
      const cards = await cardRepo.findByUserId(userId);

      let overallStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';

      const cardStatuses = cards.map((card) => {
        const effectiveSpend = card.unbilledSpend - card.midCyclePaid;
        const utilization = card.creditLimit > 0
          ? (effectiveSpend / card.creditLimit) * 100
          : 0;

        let status: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
        let suggestedPayment = 0;
        let message = 'Utilization is within safe limits.';

        if (utilization >= DANGER_THRESHOLD * 100) {
          status = 'DANGER';
          suggestedPayment = Math.max(0, effectiveSpend - (card.creditLimit * SAFE_TARGET));
          message = `Shield breached. Transfer ₱${suggestedPayment.toFixed(2)} from your GoTyme CC Stash to ${card.cardName} immediately to depress reported utilization back to a safe 28% level before the snapshot cut-off date.`;
        } else if (utilization >= 20) {
          status = 'WARNING';
          message = `Utilization at ${utilization.toFixed(1)}%. Approaching the 30% danger zone.`;
        }

        if (status === 'DANGER') {
          overallStatus = 'DANGER';
        } else if (status === 'WARNING' && overallStatus !== 'DANGER') {
          overallStatus = 'WARNING';
        }

        return {
          id: card.id,
          cardName: card.cardName,
          creditLimit: card.creditLimit,
          unbilledSpend: card.unbilledSpend,
          midCyclePaid: card.midCyclePaid,
          effectiveSpend,
          utilization: Number(utilization.toFixed(2)),
          status,
          suggestedPayment: Number(suggestedPayment.toFixed(2)),
          message,
        };
      });

      logger.info(`getCreditShieldStatus service completed successfully for userId: ${userId}`);
      return ok({ cards: cardStatuses, overallStatus });
    } catch (error) {
      logger.error(`getCreditShieldStatus service DB_ERROR for userId ${userId}:`, error);
      return err('DB_ERROR');
    }
  }
}
