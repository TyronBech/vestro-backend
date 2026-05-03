import { User, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

// We map DTOs to Prisma's generated types for simplicity,
// though pure DDD would define its own entities and mapping logic.
export type CreateUserDto = Prisma.UserCreateInput;
export type UpdateUserDto = Prisma.UserUpdateInput;

export interface IUserRepository extends IBaseRepository<User, CreateUserDto, UpdateUserDto> {
  findByEmail(email: string): Promise<User | null>;
  findByIdSelect<T extends Prisma.UserSelect>(id: string, select: T): Promise<Prisma.UserGetPayload<{ select: T }> | null>;
}
