import { Router } from 'express';
import { CoreNetworkController } from '../controllers/core-network.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createCoreNetworkSchema, updateCoreNetworkSchema } from '../schemas/core-network.schema';

const coreNetworkRouter = Router();

coreNetworkRouter.use(authenticateJWT);

coreNetworkRouter.get('/', CoreNetworkController.listNetwork);
coreNetworkRouter.post('/', validate(createCoreNetworkSchema), CoreNetworkController.addNode);
coreNetworkRouter.put('/:id', validate(updateCoreNetworkSchema), CoreNetworkController.updateNode);
coreNetworkRouter.delete('/:id', CoreNetworkController.deleteNode);

export { coreNetworkRouter };
