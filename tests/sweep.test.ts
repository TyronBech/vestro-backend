import { prisma } from '../src/infrastructure/db/prisma.client';
import { SweepService } from '../src/services/sweep.service';

describe('Sweep Service Tests', () => {
  let userId: string;
  let wantsAssetId: string;
  let targetAssetId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.sweepLog.deleteMany();
    await prisma.macroAsset.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'jest.sweep@vestro.com' },
    });

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'jest.sweep@vestro.com',
        name: 'Sweep Tester',
      },
    });
    userId = user.id;

    // Create a GoTyme Wants Sandbox asset (balance = 15000)
    const wantsAsset = await prisma.macroAsset.create({
      data: {
        userId,
        bankName: 'GoTyme Bank',
        purpose: 'Wants Sandbox',
        balance: 15000,
      },
    });
    wantsAssetId = wantsAsset.id;

    // Create a MariBank Savings vault asset (balance = 5000)
    const targetAsset = await prisma.macroAsset.create({
      data: {
        userId,
        bankName: 'MariBank',
        purpose: 'Savings Vault',
        balance: 5000,
      },
    });
    targetAssetId = targetAsset.id;
  });

  afterAll(async () => {
    await prisma.sweepLog.deleteMany();
    await prisma.macroAsset.deleteMany();
    await prisma.user.deleteMany({
      where: { id: userId },
    });
    await prisma.$disconnect();
  });

  it('Should successfully check sweep readiness when balance > 0', async () => {
    const result = await SweepService.getSweepReadiness(userId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isReady).toBe(true);
      expect(result.value.availableToSweep).toBe(15000);
      expect(result.value.sourceAsset?.id).toBe(wantsAssetId);
    }
  });

  it('Should successfully execute sweep, update both assets, and log it', async () => {
    const result = await SweepService.executeSweep(userId, 'MariBank', 'Weekly sweep');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amountSwept).toBe(15000);
      expect(result.value.targetVault).toBe('MariBank');
      expect(result.value.sourceZeroed).toBe(true);
      expect(result.value.targetUpdated).toBe(true);
    }

    // Verify database updates
    const updatedWants = await prisma.macroAsset.findUnique({ where: { id: wantsAssetId } });
    expect(updatedWants?.balance).toBe(0);

    const updatedTarget = await prisma.macroAsset.findUnique({ where: { id: targetAssetId } });
    expect(updatedTarget?.balance).toBe(20000); // 5000 + 15000

    const logs = await prisma.sweepLog.findMany({ where: { userId } });
    expect(logs).toHaveLength(1);
    const firstLog = logs[0];
    expect(firstLog).toBeDefined();
    if (firstLog) {
      expect(firstLog.amount).toBe(15000);
      expect(firstLog.targetVault).toBe('MariBank');
      expect(firstLog.notes).toBe('Weekly sweep');
    }
  });

  it('Should check sweep readiness when balance is 0 and report isReady: false', async () => {
    const result = await SweepService.getSweepReadiness(userId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isReady).toBe(false);
      expect(result.value.availableToSweep).toBe(0);
    }
  });

  it('Should reject sweep execution if no sweep is available', async () => {
    const result = await SweepService.executeSweep(userId, 'MariBank', 'Empty sweep');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('NO_SWEEP_AVAILABLE');
    }
  });

  it('Should list sweep history logs correctly', async () => {
    const result = await SweepService.listSweepHistory(userId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      const firstHistory = result.value[0];
      expect(firstHistory).toBeDefined();
      if (firstHistory) {
        expect(firstHistory.amount).toBe(15000);
      }
    }
  });
});
