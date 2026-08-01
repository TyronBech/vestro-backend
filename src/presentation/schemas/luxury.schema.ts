import { z } from 'zod';
import { LuxuryCategory, LuxuryPriority, LuxuryStatus } from '@prisma/client';

export const CreateLuxurySchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    category: z.nativeEnum(LuxuryCategory).default(LuxuryCategory.OTHER),
    price: z.number().positive({ message: 'Price must be greater than 0' }),
    description: z.string().optional(),
    priority: z.nativeEnum(LuxuryPriority).default(LuxuryPriority.MEDIUM),
    targetDate: z.string().datetime().optional().or(z.string().optional()),
  }),
});

export const UpdateLuxurySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid Luxury Item ID is required' }),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.nativeEnum(LuxuryCategory).default(LuxuryCategory.OTHER),
    price: z.number().positive().optional(),
    description: z.string().optional().nullable(),
    priority: z.nativeEnum(LuxuryPriority).default(LuxuryPriority.MEDIUM),
    status: z.nativeEnum(LuxuryStatus).default(LuxuryStatus.WISHLIST),
    targetDate: z.string().optional().nullable(),
  }),
});

export const MarkAsPurchasedSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid Luxury Item ID is required' }),
  }),
  body: z.object({
    purchasedAt: z.string().optional(),
    actualPrice: z.number().positive().optional(),
    cashFlowId: z.string().uuid().optional(),
    createCashFlow: z
      .object({
        coreNetworkId: z.string().uuid({ message: 'Valid Core Network ID is required' }),
        notes: z.string().optional(),
      })
      .optional(),
  }),
});

export const MarkAsCancelledSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid Luxury Item ID is required' }),
  }),
  body: z.object({
    cancelledAt: z.string().optional(),
    cancelReason: z.string().optional(),
  }),
});

export const LuxuryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid Luxury Item ID is required' }),
  }),
});
