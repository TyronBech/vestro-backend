import { z } from 'zod';
import { CashFlowType } from '@prisma/client';

export const CreateCashFlowSchema = z.object({
  body: z.object({
    coreNetworkId: z.string().uuid({ message: 'Valid Core Network ID is required' }),
    amount: z.number().positive({ message: 'Amount must be positive' }),
    type: z.nativeEnum(CashFlowType, { message: 'Type must be INFLOW or OUTFLOW' }),
    notes: z.string().optional(),
  }),
});
