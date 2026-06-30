import { PushToken } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { IPushTokenRepository, CreatePushTokenDto, UpdatePushTokenDto } from '../../domain/notification/notification.repository';

/**
 * Prisma-backed implementation of the PushToken repository.
 */
export class PushTokenRepositoryPg extends BaseRepositoryPg<PushToken, CreatePushTokenDto, UpdatePushTokenDto> implements IPushTokenRepository {
  constructor() {
    super('pushToken');
  }

  async findByUserId(userId: string): Promise<PushToken[]> {
    return this.db.pushToken.findMany({
      where: { userId },
    });
  }

  async findByToken(token: string): Promise<PushToken | null> {
    return this.db.pushToken.findUnique({
      where: { token },
    });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.pushToken.deleteMany({
      where: { token },
    });
  }
}
