import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../../config/env';

// Singleton pattern for Prisma Client
class PrismaDB {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaDB.instance) {
      const pool = new Pool({ connectionString: env.DIRECT_URL });
      const adapter = new PrismaPg(pool);
      PrismaDB.instance = new PrismaClient({ adapter });
    }
    return PrismaDB.instance;
  }
}

export const prisma = PrismaDB.getInstance();
