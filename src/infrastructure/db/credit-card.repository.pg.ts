import { CreditCard } from '@prisma/client';
import { BaseRepositoryPg } from './base.repository.pg';
import { ICreditCardRepository, CreateCreditCardDto, UpdateCreditCardDto } from '../../domain/credit-card/credit-card.repository';

/**
 * Prisma-backed implementation of the CreditCard repository.
 */
export class CreditCardRepositoryPg
  extends BaseRepositoryPg<CreditCard, CreateCreditCardDto, UpdateCreditCardDto>
  implements ICreditCardRepository
{
  constructor() {
    super('creditCard');
  }

  async findByUserId(userId: string): Promise<CreditCard[]> {
    return this.db.creditCard.findMany({
      where: { userId },
      include: {
        macroAsset: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async incrementUnbilledSpend(cardId: string, amount: number): Promise<CreditCard> {
    return this.db.creditCard.update({
      where: { id: cardId },
      data: { unbilledSpend: { increment: amount } },
    });
  }

  async incrementMidCyclePaid(cardId: string, amount: number): Promise<CreditCard> {
    return this.db.creditCard.update({
      where: { id: cardId },
      data: { midCyclePaid: { increment: amount } },
    });
  }

  async resetCycle(cardId: string): Promise<CreditCard> {
    return this.db.creditCard.update({
      where: { id: cardId },
      data: { unbilledSpend: 0, midCyclePaid: 0 },
    });
  }

  async findByDueDay(dueDay: number): Promise<CreditCard[]> {
    return this.db.creditCard.findMany({
      where: { paymentDueDay: dueDay },
    });
  }
}
