import { Router } from 'express';
import { SweepController } from '../controllers/sweep.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { executeSweepSchema, createManualSweepSchema } from '../schemas/sweep.schema';

export const sweepRouter = Router();

sweepRouter.get('/readiness', authenticateJWT, SweepController.getSweepReadiness);
sweepRouter.post('/execute', authenticateJWT, validate(executeSweepSchema), SweepController.executeSweep);
sweepRouter.post('/manual', authenticateJWT, validate(createManualSweepSchema), SweepController.createManualSweep);
sweepRouter.get('/history', authenticateJWT, SweepController.listSweepHistory);
