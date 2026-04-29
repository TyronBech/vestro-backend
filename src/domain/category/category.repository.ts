import { Category, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateCategoryDto = Prisma.CategoryCreateInput;
export type UpdateCategoryDto = Prisma.CategoryUpdateInput;

export interface ICategoryRepository extends IBaseRepository<Category, CreateCategoryDto, UpdateCategoryDto> {
  findByUserId(userId: string): Promise<Category[]>;
}
