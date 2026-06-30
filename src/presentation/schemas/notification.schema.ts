import { z } from 'zod';

export const registerTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    deviceType: z.string().optional().nullable(),
    deviceName: z.string().optional().nullable(),
  }),
});

export const unregisterTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});
