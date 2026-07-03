import { z } from 'zod';
import { CoreNetworkType } from '@prisma/client';

export const createCoreNetworkSchema = z.object({
  body: z.object({
    macroAssetId: z.string().uuid('Invalid Macro Asset ID'),
    parentId: z.string().uuid('Invalid Parent ID').optional().nullable(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
    type: z.nativeEnum(CoreNetworkType).optional().nullable(),
  }),
});

export const updateCoreNetworkSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100').optional(),
    type: z.nativeEnum(CoreNetworkType).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Core Network ID'),
  }),
});
