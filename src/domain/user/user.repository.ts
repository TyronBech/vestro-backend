import { User, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateUserDto = Prisma.UserCreateInput;
export type UpdateUserDto = Prisma.UserUpdateInput;

/**
 * Domain interface for User persistence operations.
 * Extends base CRUD with authentication-specific queries.
 */
export interface IUserRepository extends IBaseRepository<User, CreateUserDto, UpdateUserDto> {
  /** Finds a user by their unique email address. */
  findByEmail(email: string): Promise<User | null>;
}
