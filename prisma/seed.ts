import { env } from '../src/config/env'
import { PrismaClient, CashFlowType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // 1. CLEANUP
  await prisma.sweepLog.deleteMany();
  await prisma.cashFlow.deleteMany();
  await prisma.coreNetwork.deleteMany();
  await prisma.macroAsset.deleteMany();
  await prisma.user.deleteMany();

  // 2. CREATE THE EXCLUSIVE USER
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'tyron.bechayda@vestro.app',
      name: 'Tyron Bechayda',
      biometricsEnabled: true,
      panicModeEnabled: true,
      passwordHash,
    },
  });
  console.log(`Created User: ${user.name}`);

  // 3. CREATE MACRO ASSETS (BANKS)
  console.log('Creating Macro Assets...');
  const banksData = [
    { bankName: 'BPI', purpose: 'Daily Expenses', balance: 50000 },
    { bankName: 'BDO', purpose: 'Emergency Fund', balance: 150000 },
    { bankName: 'GCash', purpose: 'Wants Sandbox', balance: 20000 },
  ];

  for (const b of banksData) {
    const macroAsset = await prisma.macroAsset.create({
      data: {
        userId: user.id,
        bankName: b.bankName,
        purpose: b.purpose,
        balance: b.balance,
      },
    });
    console.log(`  Created Macro Asset: ${macroAsset.bankName}`);

    // 4. CREATE CORE NETWORKS
    const networksData = [
      { name: 'Income Catch', percentage: 0.5, balance: b.balance * 0.5 },
      { name: 'Needs Router', percentage: 0.3, balance: b.balance * 0.3 },
      { name: 'Wants Router', percentage: 0.2, balance: b.balance * 0.2 },
    ];

    for (const n of networksData) {
      const coreNetwork = await prisma.coreNetwork.create({
        data: {
          userId: user.id,
          macroAssetId: macroAsset.id,
          name: n.name,
          percentage: n.percentage,
          balance: n.balance,
        },
      });
      console.log(`    Created Core Network: ${coreNetwork.name}`);

      // 5. CREATE CASH FLOWS (Both Inflow and Outflow)
      const cashFlowsData = [
        { amount: 15000, type: CashFlowType.INFLOW, notes: 'Salary Inflow' },
        { amount: 5000, type: CashFlowType.OUTFLOW, notes: 'Utility Bill' },
        { amount: 1500, type: CashFlowType.OUTFLOW, notes: 'Grocery' },
      ];

      for (const cf of cashFlowsData) {
        await prisma.cashFlow.create({
          data: {
            userId: user.id,
            coreNetworkId: coreNetwork.id,
            amount: cf.amount,
            type: cf.type,
            notes: cf.notes,
          },
        });
      }
      console.log(`      Created 3 CashFlows for ${coreNetwork.name}`);
    }
  }

  // 6. CREATE SWEEP LOGS
  console.log('Creating Sweep Logs...');
  const sweepLogsData = [
    { amount: 2000, targetVault: 'High Yield Savings', notes: 'Monthly excess swept' },
    { amount: 500, targetVault: 'Maya', notes: 'Unused wants' },
  ];

  for (const sl of sweepLogsData) {
    await prisma.sweepLog.create({
      data: {
        userId: user.id,
        amount: sl.amount,
        targetVault: sl.targetVault,
        notes: sl.notes,
      },
    });
  }
  console.log('  Created Sweep Logs');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });