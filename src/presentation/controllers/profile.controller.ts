import { Response } from 'express';
import { ProfileService, UpdateProfileInput } from '../../services/profile.service';

export class ProfileController {
  /**
   * GET /profile
   * Returns the authenticated user's profile (no sensitive fields).
   */
  static async getProfile(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await ProfileService.getProfile(userId);

    if (!result.ok) {
      const status = result.error === 'USER_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Profile not found' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }

  /**
   * PATCH /profile
   * Partially updates the authenticated user's profile.
   * All input is pre-validated by the `validate(updateProfileSchema)` middleware.
   * Only send the fields you want to change — unspecified fields are left untouched.
   */
  static async updateProfile(req: any, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ errors: [{ code: 'UNAUTHORIZED', message: 'Not authenticated' }] });
      return;
    }

    const result = await ProfileService.updateProfile(userId, req.body as UpdateProfileInput);

    if (!result.ok) {
      const status = result.error === 'USER_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ errors: [{ code: result.error, message: 'Failed to update profile' }] });
      return;
    }

    res.status(200).json({ data: result.value });
  }
}
