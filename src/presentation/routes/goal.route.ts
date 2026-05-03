import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createGoalSchema } from '../schemas/goal.schema';

export const goalRouter = Router();

goalRouter.post('/', authenticateJWT, validate(createGoalSchema), GoalController.createGoal);
goalRouter.get('/', authenticateJWT, GoalController.listGoals);
