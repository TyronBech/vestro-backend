import { Bank, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateBankDto = Prisma.BankCreateInput;
export type UpdateBankDto = Prisma.BankUpdateInput;

export interface IBankRepository extends IBaseRepository<Bank, CreateBankDto, UpdateBankDto> {}
