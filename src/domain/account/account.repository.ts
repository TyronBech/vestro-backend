import { Account, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateAccountDto = Prisma.AccountCreateInput;
export type UpdateAccountDto = Prisma.AccountUpdateInput;

export interface IAccountRepository extends IBaseRepository<Account, CreateAccountDto, UpdateAccountDto> {
  findByUserId(userId: string): Promise<Account[]>;
}
