/**
 * Base repository interface following Domain-Driven Design (DDD) principles.
 * Defines the standard contract for all domain repositories.
 */
export interface IBaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}
