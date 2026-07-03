import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { upsertBudgetConfigSchema, paydaySplitSchema } from '../schemas/budget.schema';

export const budgetRouter = Router();

budgetRouter.get('/', authenticateJWT, BudgetController.getBudgetConfig);
budgetRouter.put('/', authenticateJWT, validate(upsertBudgetConfigSchema), BudgetController.upsertBudgetConfig);
budgetRouter.post('/payday-split', authenticateJWT, validate(paydaySplitSchema), BudgetController.paydaySplit);
