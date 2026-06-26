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
  const bpiAsset = await prisma.macroAsset.create({
    data: {
      userId: user.id,
      bankName: 'Bank of the Philippine Islands',
      purpose: 'Daily Expenses',
      balance: 5000000, // ₱50,000.00
      colorCode: '#b11116',
      iconUrl: 'https://example.com/image1.png',
    },
  });
  const gcashAsset = await prisma.macroAsset.create({
    data: {
      userId: user.id,
      bankName: 'GCash',
      purpose: 'Emergency Fund',
      balance: 15000000, // ₱150,000.00
      colorCode: '#1972f9',
      iconUrl: 'https://example.com/image2.png',
    },
  });
  const mayaAsset = await prisma.macroAsset.create({
    data: {
      userId: user.id,
      bankName: 'Maya',
      purpose: 'Wants Sandbox',
      balance: 2000000, // ₱20,000.00
      colorCode: '#75eea5',
      iconUrl: 'https://example.com/image3.png',
    },
  });
  console.log('Created Macro Assets.');

  // 4. CREATE CORE NETWORKS
  console.log('Creating Core Networks...');
  const networksData = [
    // BPI (Daily Expenses)
    { name: 'Income Catch', type: 'PAYCHECK', percentage: 0.5, balance: 1000000, macroAssetId: bpiAsset.id },
    { name: 'Rent Vault', type: 'RENT', percentage: 0.3, balance: 2500000, macroAssetId: bpiAsset.id },
    { name: 'Utility Router', type: 'UTILITIES', percentage: 0.2, balance: 1500000, macroAssetId: bpiAsset.id },
    
    // GCash (Emergency Fund)
    { name: 'Emergency Shield', type: 'EMERGENCY_FUND', percentage: 0.6, balance: 10000000, macroAssetId: gcashAsset.id },
    { name: 'Insurance Premium', type: 'INSURANCE', percentage: 0.4, balance: 5000000, macroAssetId: gcashAsset.id },
    
    // Maya (Wants Sandbox)
    { name: 'Wants Sandbox', type: 'WANTS_SANDBOX', percentage: 0.5, balance: 1000000, macroAssetId: mayaAsset.id },
    { name: 'Crypto GInvest', type: 'INVESTMENTS', percentage: 0.5, balance: 1000000, macroAssetId: mayaAsset.id },
  ];

  for (const n of networksData) {
    const coreNetwork = await prisma.coreNetwork.create({
      data: {
        userId: user.id,
        macroAssetId: n.macroAssetId,
        name: n.name,
        type: n.type as any,
        percentage: n.percentage,
        balance: n.balance,
      },
    });
    console.log(`  Created Core Network: ${coreNetwork.name} (${coreNetwork.type})`);

    // 5. CREATE CASH FLOWS (Both Inflow and Outflow)
    const monthsAgo = [3, 2, 1, 0];
    for (const offset of monthsAgo) {
      const date = new Date();
      date.setMonth(date.getMonth() - offset);
      // Inflow
      await prisma.cashFlow.create({
        data: {
          userId: user.id,
          coreNetworkId: coreNetwork.id,
          amount: coreNetwork.balance * 0.15,
          type: CashFlowType.INFLOW,
          notes: `${coreNetwork.name} Inflow`,
          createdAt: date,
        },
      });
      // Outflow
      await prisma.cashFlow.create({
        data: {
          userId: user.id,
          coreNetworkId: coreNetwork.id,
          amount: coreNetwork.balance * 0.1,
          type: CashFlowType.OUTFLOW,
          notes: `${coreNetwork.name} Outflow`,
          createdAt: date,
        },
      });
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