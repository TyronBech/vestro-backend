import { prisma } from '../src/infrastructure/db/prisma.client';
import { BudgetService } from '../src/services/budget.service';

describe('Budget Service Tests', () => {
  let userId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.budgetConfig.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'jest.budget@vestro.com' },
    });

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'jest.budget@vestro.com',
        name: 'Budget Tester',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.budgetConfig.deleteMany();
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  it('Should return null/notFound when getting a non-existent budget config', async () => {
    const result = await BudgetService.getBudgetConfig(userId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeNull();
    }
  });

  it('Should successfully create budget config with valid rates (sum to 1.0)', async () => {
    const result = await BudgetService.upsertBudgetConfig(userId, {
      netSalary: 25000,
      needsRate: 0.50,
      wantsRate: 0.30,
      savingsRate: 0.10,
      investmentsRate: 0.10,
      cashAmount: 10000, // half-rent will be 5000
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.netSalary).toBe(25000);
      expect(result.value.needsRate).toBe(0.50);
      expect(result.value.cashAmount).toBe(10000);
    }
  });

  it('Should reject budget config with invalid rates (sum does not equal 1.0)', async () => {
    const result = await BudgetService.upsertBudgetConfig(userId, {
      netSalary: 25000,
      needsRate: 0.50,
      wantsRate: 0.50, // total sum will be 1.20
      savingsRate: 0.10,
      investmentsRate: 0.10,
      cashAmount: 10000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('INVALID_RATES');
    }
  });

  it('Should correctly calculate payday split routing instructions', async () => {
    // netPaycheck = 30000
    // needs (50%) = 15000
    // wants (30%) = 9000
    // savings (10%) = 3000
    // investments (10%) = 3000
    // halfRent = cashAmount / 2 = 5000
    // billsCash = needs - halfRent = 10000
    const result = await BudgetService.calculatePaydaySplit(userId, 30000);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.netPaycheck).toBe(30000);
      expect(result.value.breakdown.needs).toBe(15000);
      expect(result.value.breakdown.wants).toBe(9000);
      expect(result.value.halfRent).toBe(5000);
      expect(result.value.billsCash).toBe(10000);

      // Verify routing instructions
      expect(result.value.routingInstructions).toHaveLength(5);
      expect(result.value.routingInstructions[0]).toEqual({
        label: 'Half-Rent',
        target: 'LandBank',
        amount: 5000,
        description: 'Retain in LandBank for rent.',
      });
      expect(result.value.routingInstructions[1]).toEqual({
        label: 'Bills Cash',
        target: 'GoTyme CC Stash',
        amount: 10000,
        description: 'Transfer to GoTyme CC Stash for bills.',
      });
      expect(result.value.routingInstructions[2]).toEqual({
        label: 'Wants Sandbox',
        target: 'GoTyme Dashboard',
        amount: 9000,
        description: 'Keep on GoTyme Dashboard for discretionary spending.',
      });
    }
  });

  it('Should fail payday split calculation if needs share is less than half-rent', async () => {
    // netPaycheck = 8000
    // needs (50%) = 4000
    // halfRent = 5000
    // billsCash = 4000 - 5000 = -1000 (negative!)
    const result = await BudgetService.calculatePaydaySplit(userId, 8000);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('INSUFFICIENT_NEEDS');
    }
  });

  it('Should fail payday split calculation if budget config does not exist', async () => {
    const result = await BudgetService.calculatePaydaySplit('non-existent-user-id', 30000);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('CONFIG_NOT_FOUND');
    }
  });
});
