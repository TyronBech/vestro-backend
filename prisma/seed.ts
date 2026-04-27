/// <reference types="node" />
import { env } from '../src/config/env'
import { PrismaClient, TransactionFlow, TransactionType, GoalStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. CLEANUP: Wipe existing data
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // 2. CREATE THE EXCLUSIVE USER
  const user = await prisma.user.create({
    data: {
      email: 'tyron.bechayda@vestro.app',
      firstName: 'Tyron',
      middleName: 'Panti',
      lastName: 'Bechayda',
      suffix: null,
      currency: 'PHP',
      biometricsEnabled: true,
      panicModeEnabled: true,
    },
  });
  console.log(`👤 Created User: ${user.firstName} ${user.lastName}`);

  // 3. CREATE DYNAMIC EXPENSE CATEGORIES
  // Mapping the requested categories to Lucide icons
  const EXPENSE_CATEGORIES = [
    { name: 'Food', icon: 'utensils' },
    { name: 'Transportation', icon: 'car' },
    { name: 'Games', icon: 'gamepad-2' },
    { name: 'Mobile', icon: 'smartphone' },
    { name: 'Utilities', icon: 'zap' },
    { name: 'Shopping', icon: 'shopping-bag' },
    { name: 'Grocery', icon: 'shopping-cart' },
  ];

  const dbExpenseCategories: Record<string, any> = {};

  console.log('📂 Creating Expense Categories...');
  for (const cat of EXPENSE_CATEGORIES) {
    dbExpenseCategories[cat.name] = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: '#ee4e43', // Flat Minimalism Expense Color
        type: TransactionType.EXPENSE,
      },
    });
  }

  // Create standard Income and Savings categories for the ledger math
  const incomeCategory = await prisma.category.create({
    data: { userId: user.id, name: 'Web Dev Freelance', icon: 'monitor', color: '#373737', type: TransactionType.INCOME }
  });

  const savingsCategory = await prisma.category.create({
    data: { userId: user.id, name: 'Motorcycle Fund', icon: 'wallet', color: '#373737', type: TransactionType.SAVINGS }
  });

  // 4. CREATE THE GOAL
  const xsrGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: 'Yamaha XSR155',
      targetAmount: 18200000, 
      currentAmount: 0,
      status: GoalStatus.IN_PROGRESS,
    },
  });
  console.log(`🎯 Created Goal: ${xsrGoal.title}`);

  // 5. SEED TRANSACTIONS
  
  // A. Initial Income
  await prisma.transaction.create({
    data: {
      userId: user.id,
      title: 'Initial Project Deposit',
      amount: 3000000, 
      flow: TransactionFlow.INFLOW,
      type: TransactionType.INCOME,
      categoryId: incomeCategory.id,
    }
  });

  // B. Standard Expenses using the new dynamic categories
  await prisma.transaction.create({
    data: {
      userId: user.id,
      title: 'Lunch',
      amount: 25000,
      flow: TransactionFlow.OUTFLOW,
      type: TransactionType.EXPENSE,
      categoryId: dbExpenseCategories['Food'].id,
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      title: 'Steam Sale',
      amount: 85000,
      flow: TransactionFlow.OUTFLOW,
      type: TransactionType.EXPENSE,
      categoryId: dbExpenseCategories['Games'].id,
    }
  });

  // C. SAVINGS DEPOSIT
  const savingsDeposit = await prisma.transaction.create({
    data: {
      userId: user.id,
      title: 'First Bike Deposit!',
      amount: 1000000,
      flow: TransactionFlow.NEUTRAL,
      type: TransactionType.SAVINGS,
      categoryId: savingsCategory.id,
      goalId: xsrGoal.id, 
    }
  });

  // 6. UPDATE GOAL PROGRESS
  await prisma.goal.update({
    where: { id: xsrGoal.id },
    data: { currentAmount: savingsDeposit.amount }
  });

  console.log('💸 Seeded Transactions and updated Goal progress.');
  console.log('✅ Seeding complete!');
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