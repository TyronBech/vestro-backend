import { Account } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IAccountRepository, CreateAccountDto, UpdateAccountDto } from '../../domain/account/account.repository';

export class AccountRepositoryPg extends BaseRepositoryPg<Account, CreateAccountDto, UpdateAccountDto> implements IAccountRepository {
  constructor() {
    super('account');
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.db.account.findMany({
      where: { userId },
    });
  }
}
