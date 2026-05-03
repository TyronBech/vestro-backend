import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../schemas/user.schema';

export const profileRouter = Router();

// GET /profile — fetch the authenticated user's own profile
profileRouter.get('/', authenticateJWT, ProfileController.getProfile);

// PATCH /profile — partial update: name, avatar, currency, security toggles
profileRouter.patch('/', authenticateJWT, validate(updateProfileSchema), ProfileController.updateProfile);
