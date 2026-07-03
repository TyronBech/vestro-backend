import { prisma } from '../src/infrastructure/db/prisma.client';
import { CreditCardService } from '../src/services/credit-card.service';

describe('Credit Card Service Tests', () => {
  let userId1: string;
  let userId2: string;
  let cardId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.creditCard.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: { in: ['jest.cc1@vestro.com', 'jest.cc2@vestro.com'] },
      },
    });

    // Create two test users to verify ownership protection
    const user1 = await prisma.user.create({
      data: {
        email: 'jest.cc1@vestro.com',
        name: 'CC Owner',
      },
    });
    userId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'jest.cc2@vestro.com',
        name: 'CC Hacker',
      },
    });
    userId2 = user2.id;
  });

  afterAll(async () => {
    await prisma.creditCard.deleteMany();
    await prisma.user.deleteMany({
      where: { id: { in: [userId1, userId2] } },
    });
    await prisma.$disconnect();
  });

  it('Should return empty array when listing cards for a user with none', async () => {
    const result = await CreditCardService.listCards(userId1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('Should successfully add a new credit card', async () => {
    const result = await CreditCardService.addCard(userId1, {
      cardName: 'UnionBank Rewards',
      creditLimit: 100000,
      statementCutoffDay: 15,
      paymentDueDay: 5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBeDefined();
      expect(result.value.cardName).toBe('UnionBank Rewards');
      expect(result.value.unbilledSpend).toBe(0.0);
      expect(result.value.midCyclePaid).toBe(0.0);
      cardId = result.value.id;
    }
  });

  it('Should successfully update a credit card if owned by user', async () => {
    const result = await CreditCardService.updateCard(userId1, cardId, {
      cardName: 'UnionBank Platinum',
      creditLimit: 120000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.cardName).toBe('UnionBank Platinum');
      expect(result.value.creditLimit).toBe(120000);
    }
  });

  it('Should reject update of a card if not owned by the requesting user', async () => {
    const result = await CreditCardService.updateCard(userId2, cardId, {
      cardName: 'Hacked Card',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('NOT_FOUND');
    }
  });

  it('Should successfully record credit card spend', async () => {
    const result = await CreditCardService.recordSpend(userId1, cardId, 36000); // 36k spend (30% of 120k limit)

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.unbilledSpend).toBe(36000);
    }
  });

  it('Should successfully record mid-cycle payment', async () => {
    const result = await CreditCardService.recordMidCyclePayment(userId1, cardId, 5000); // Pay 5k early

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.midCyclePaid).toBe(5000);
    }
  });

  it('Should calculate Credit Shield status and recommendations correctly', async () => {
    // Current state of cardId:
    // creditLimit = 120000
    // unbilledSpend = 36000
    // midCyclePaid = 5000
    // effectiveSpend = 36000 - 5000 = 31000
    // utilization = 31000 / 120000 = 25.83% -> WARNING status (since >= 20% and < 30%)
    let shield = await CreditCardService.getCreditShieldStatus(userId1);
    expect(shield.ok).toBe(true);
    if (shield.ok) {
      const cardStatus = shield.value.cards.find(c => c.id === cardId);
      expect(cardStatus).toBeDefined();
      expect(cardStatus?.utilization).toBe(25.83);
      expect(cardStatus?.status).toBe('WARNING');
      expect(cardStatus?.suggestedPayment).toBe(0);
      expect(shield.value.overallStatus).toBe('WARNING');
    }

    // Increment spend to trigger DANGER (utilization >= 30%)
    // Let's add 10000 to spend -> unbilledSpend = 46000
    // effectiveSpend = 46000 - 5000 = 41000
    // utilization = 41000 / 120000 = 34.17% -> DANGER
    // suggestedPayment = effectiveSpend - (limit * 0.28) = 41000 - (120000 * 0.28) = 41000 - 33600 = 7400
    await CreditCardService.recordSpend(userId1, cardId, 10000);

    shield = await CreditCardService.getCreditShieldStatus(userId1);
    expect(shield.ok).toBe(true);
    if (shield.ok) {
      const cardStatus = shield.value.cards.find(c => c.id === cardId);
      expect(cardStatus?.utilization).toBe(34.17);
      expect(cardStatus?.status).toBe('DANGER');
      expect(cardStatus?.suggestedPayment).toBe(7400);
      expect(shield.value.overallStatus).toBe('DANGER');
    }
  });

  it('Should reject delete of a card if not owned by user', async () => {
    const result = await CreditCardService.deleteCard(userId2, cardId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('NOT_FOUND');
    }
  });

  it('Should successfully delete a card if owned by user', async () => {
    const result = await CreditCardService.deleteCard(userId1, cardId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(true);
    }

    const list = await CreditCardService.listCards(userId1);
    expect(list.ok).toBe(true);
    if (list.ok) {
      expect(list.value).toEqual([]);
    }
  });
});
