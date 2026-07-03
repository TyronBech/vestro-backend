import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CashFlowController } from '../controllers/cash-flow.controller';
import { CreateCashFlowSchema } from '../schemas/cash-flow.schema';

const router = Router();

// Protect all cash flow routes
router.use(authenticateJWT);

router.get('/', CashFlowController.listCashFlows);
router.post('/', validate(CreateCashFlowSchema), CashFlowController.createCashFlow);

export default router;
