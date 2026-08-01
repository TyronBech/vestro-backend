import { LuxuryItem, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateLuxuryItemDto = Prisma.LuxuryItemUncheckedCreateInput;
export type UpdateLuxuryItemDto = Prisma.LuxuryItemUncheckedUpdateInput;

export interface ILuxuryRepository extends IBaseRepository<LuxuryItem, CreateLuxuryItemDto, UpdateLuxuryItemDto> {
  findByUserId(userId: string): Promise<LuxuryItem[]>;
}
