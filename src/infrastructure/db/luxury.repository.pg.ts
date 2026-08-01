import { LuxuryItem } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ILuxuryRepository, CreateLuxuryItemDto, UpdateLuxuryItemDto } from '../../domain/luxury/luxury.repository';

export class LuxuryRepositoryPg
  extends BaseRepositoryPg<LuxuryItem, CreateLuxuryItemDto, UpdateLuxuryItemDto>
  implements ILuxuryRepository
{
  constructor() {
    super('luxuryItem');
  }

  async findByUserId(userId: string): Promise<LuxuryItem[]> {
    return this.db.luxuryItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        cashFlow: {
          include: {
            coreNetwork: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<LuxuryItem | null> {
    return this.db.luxuryItem.findUnique({
      where: { id },
      include: {
        cashFlow: {
          include: {
            coreNetwork: true,
          },
        },
      },
    });
  }
}
