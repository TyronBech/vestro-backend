import { Router } from 'express';
import { MacroAssetController } from '../controllers/macro-asset.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { createMacroAssetSchema, updateMacroAssetSchema } from '../schemas/macro-asset.schema';

const idParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid asset ID"),
  }),
});

export const macroAssetRouter = Router();

macroAssetRouter.get('/', authenticateJWT, MacroAssetController.listAssets);
macroAssetRouter.post('/', authenticateJWT, validate(createMacroAssetSchema), MacroAssetController.addAsset);
macroAssetRouter.patch('/:id', authenticateJWT, validate(updateMacroAssetSchema), MacroAssetController.updateAsset);
macroAssetRouter.delete('/:id', authenticateJWT, validate(idParamSchema), MacroAssetController.deleteAsset);
