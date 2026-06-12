import { Category } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ICategoryRepository, CreateCategoryDto, UpdateCategoryDto } from '../../domain/category/category.repository';

export class CategoryRepositoryPg extends BaseRepositoryPg<Category, CreateCategoryDto, UpdateCategoryDto> implements ICategoryRepository {
  constructor() {
    super('category');
  }

  async findByUserId(userId: string): Promise<Category[]> {
    return this.db.category.findMany();
  }
}
