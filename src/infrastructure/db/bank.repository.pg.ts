import { Bank } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IBankRepository, CreateBankDto, UpdateBankDto } from '../../domain/bank/bank.repository';

export class BankRepositoryPg extends BaseRepositoryPg<Bank, CreateBankDto, UpdateBankDto> implements IBankRepository {
  constructor() {
    super('bank');
  }
}
