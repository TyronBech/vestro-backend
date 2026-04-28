import { User } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IUserRepository, CreateUserDto, UpdateUserDto } from '../../domain/user/user.repository';

export class UserRepositoryPg extends BaseRepositoryPg<User, CreateUserDto, UpdateUserDto> implements IUserRepository {
  constructor() {
    super('user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }
}
