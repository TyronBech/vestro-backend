import { CreditCard, Prisma } from '@prisma/client';
import { IBaseRepository } from '../core/base.repository';

export type CreateCreditCardDto = Prisma.CreditCardUncheckedCreateInput;
export type UpdateCreditCardDto = Prisma.CreditCardUncheckedUpdateInput;

/**
 * Domain interface for CreditCard persistence operations.
 * A user can have multiple credit cards (1:N).
 */
export interface ICreditCardRepository extends IBaseRepository<CreditCard, CreateCreditCardDto, UpdateCreditCardDto> {
  /** Returns all credit cards belonging to a user. */
  findByUserId(userId: string): Promise<CreditCard[]>;

  /** Atomically increments the unbilled spend on a card. */
  incrementUnbilledSpend(cardId: string, amount: number): Promise<CreditCard>;

  /** Atomically increments the mid-cycle paid amount on a card. */
  incrementMidCyclePaid(cardId: string, amount: number): Promise<CreditCard>;

  /** Resets unbilledSpend and midCyclePaid to 0 (end-of-cycle reset). */
  resetCycle(cardId: string): Promise<CreditCard>;

  /** Returns all credit cards where paymentDueDay matches the specified day. */
  findByDueDay(dueDay: number): Promise<CreditCard[]>;
}
