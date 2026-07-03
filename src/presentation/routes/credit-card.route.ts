import { Router } from 'express';
import { CreditCardController } from '../controllers/credit-card.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import {
  createCreditCardSchema,
  updateCreditCardSchema,
  recordSpendSchema,
  recordMidCyclePaymentSchema
} from '../schemas/credit-card.schema';

const idParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid card ID"),
  }),
});

export const creditCardRouter = Router();

creditCardRouter.get('/', authenticateJWT, CreditCardController.listCards);
creditCardRouter.get('/shield-status', authenticateJWT, CreditCardController.getShieldStatus);
creditCardRouter.post('/', authenticateJWT, validate(createCreditCardSchema), CreditCardController.addCard);
creditCardRouter.patch('/:id', authenticateJWT, validate(updateCreditCardSchema), CreditCardController.updateCard);
creditCardRouter.delete('/:id', authenticateJWT, validate(idParamSchema), CreditCardController.deleteCard);
creditCardRouter.post('/:id/spend', authenticateJWT, validate(recordSpendSchema), CreditCardController.recordSpend);
creditCardRouter.post('/:id/mid-cycle-payment', authenticateJWT, validate(recordMidCyclePaymentSchema), CreditCardController.recordMidCyclePayment);
creditCardRouter.post('/:id/reset', authenticateJWT, validate(idParamSchema), CreditCardController.resetCycle);
