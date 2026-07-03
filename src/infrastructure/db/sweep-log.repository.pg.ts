import { SweepLog } from '@prisma/client';
import { prisma } from './prisma.client';
import { ISweepLogRepository, CreateSweepLogDto } from '../../domain/sweep-log/sweep-log.repository';

/**
 * Prisma-backed implementation of the SweepLog repository.
 * Append-only — no update or delete operations.
 */
export class SweepLogRepositoryPg implements ISweepLogRepository {
  private readonly db = prisma;

  async findByUserId(userId: string): Promise<SweepLog[]> {
    return this.db.sweepLog.findMany({
      where: { userId },
      orderBy: { sweptAt: 'desc' },
    });
  }

  async create(data: CreateSweepLogDto): Promise<SweepLog> {
    return this.db.sweepLog.create({ data });
  }
}
