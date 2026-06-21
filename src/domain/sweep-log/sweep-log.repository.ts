import { SweepLog, Prisma } from '@prisma/client';

export type CreateSweepLogDto = Prisma.SweepLogUncheckedCreateInput;

/**
 * Domain interface for SweepLog persistence operations.
 * SweepLogs are append-only — they are never updated or deleted.
 */
export interface ISweepLogRepository {
  /** Returns all sweep logs for a user, ordered newest first. */
  findByUserId(userId: string): Promise<SweepLog[]>;

  /** Creates a new sweep log entry. */
  create(data: CreateSweepLogDto): Promise<SweepLog>;
}
