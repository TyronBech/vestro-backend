import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createBudgetConfigSchema,
  updateBudgetConfigSchema,
  budgetConfigParamSchema,
  upsertBudgetConfigSchema,
  paydaySplitSchema,
} from '../schemas/budget.schema';

export const budgetRouter = Router();

budgetRouter.get('/', authenticateJWT, BudgetController.getBudgetConfigs);
budgetRouter.get('/primary', authenticateJWT, BudgetController.getBudgetConfig);
budgetRouter.get('/:id', authenticateJWT, validate(budgetConfigParamSchema), BudgetController.getBudgetConfigById);
budgetRouter.post('/', authenticateJWT, validate(createBudgetConfigSchema), BudgetController.createBudgetConfig);
budgetRouter.put('/', authenticateJWT, validate(upsertBudgetConfigSchema), BudgetController.upsertBudgetConfig);
budgetRouter.put('/:id', authenticateJWT, validate(budgetConfigParamSchema), validate(updateBudgetConfigSchema), BudgetController.updateBudgetConfig);
budgetRouter.delete('/:id', authenticateJWT, validate(budgetConfigParamSchema), BudgetController.deleteBudgetConfig);
budgetRouter.post('/payday-split', authenticateJWT, validate(paydaySplitSchema), BudgetController.paydaySplit);
