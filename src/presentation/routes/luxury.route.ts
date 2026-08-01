import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { LuxuryController } from '../controllers/luxury.controller';
import {
  CreateLuxurySchema,
  UpdateLuxurySchema,
  MarkAsPurchasedSchema,
  MarkAsCancelledSchema,
  LuxuryIdParamSchema,
} from '../schemas/luxury.schema';

const router = Router();

// Protect all luxury routes with JWT auth
router.use(authenticateJWT);

router.get('/', LuxuryController.listLuxuryItems);
router.post('/', validate(CreateLuxurySchema), LuxuryController.createLuxuryItem);
router.put('/:id', validate(UpdateLuxurySchema), LuxuryController.updateLuxuryItem);
router.post('/:id/purchase', validate(MarkAsPurchasedSchema), LuxuryController.markAsPurchased);
router.post('/:id/cancel', validate(MarkAsCancelledSchema), LuxuryController.markAsCancelled);
router.delete('/:id', validate(LuxuryIdParamSchema), LuxuryController.deleteLuxuryItem);

export { router as luxuryRouter };
export default router;
