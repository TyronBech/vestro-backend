import { IBaseRepository } from '../../domain/core/base.repository';
import { prisma } from './prisma.client';

/**
 * Abstract Prisma base repository that implements standard CRUD operations.
 */
export abstract class BaseRepositoryPg<T, CreateDTO, UpdateDTO> implements IBaseRepository<T, CreateDTO, UpdateDTO> {
  protected readonly db = prisma;

  // We rely on the generic 'model' representation in prisma to execute generic queries
  constructor(protected readonly modelName: any) {}

  async findById(id: string): Promise<T | null> {
    const delegate = this.getDelegate();
    return delegate.findUnique({
      where: { id } as any,
    }) as Promise<T | null>;
  }

  async findAll(): Promise<T[]> {
    const delegate = this.getDelegate();
    return delegate.findMany() as Promise<T[]>;
  }

  async create(data: CreateDTO): Promise<T> {
    const delegate = this.getDelegate();
    return delegate.create({
      data,
    }) as Promise<T>;
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const delegate = this.getDelegate();
    return delegate.update({
      where: { id } as any,
      data,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    const delegate = this.getDelegate();
    await delegate.delete({
      where: { id } as any,
    });
  }

  protected getDelegate(): any {
    return (this.db as any)[this.modelName];
  }
}
