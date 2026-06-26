import { Result, ok, err } from '../utils/result';
import { BudgetConfigRepositoryPg } from '../infrastructure/db/budget-config.repository.pg';
import { MacroAssetRepositoryPg } from '../infrastructure/db/macro-asset.repository.pg';
import { CoreNetworkRepositoryPg } from '../infrastructure/db/core-network.repository.pg';
import { CashFlowRepositoryPg } from '../infrastructure/db/cash-flow.repository.pg';
import { logger } from '../utils/logger';

const budgetConfigRepo = new BudgetConfigRepositoryPg();
const macroAssetRepo = new MacroAssetRepositoryPg();
const coreNetworkRepo = new CoreNetworkRepositoryPg();
const cashFlowRepo = new CashFlowRepositoryPg();

export class AnalyticsService {
  /**
   * Consolidates financial telemetry for charts and calculator components.
   */
  static async getAnalyticsData(userId: string): Promise<Result<any, 'DB_ERROR'>> {
    try {
      logger.info(`[AnalyticsService.getAnalyticsData] Fetching analytics for userId: ${userId}`);

      // 1. Fetch core records
      const budgetConfig = await budgetConfigRepo.findByUserId(userId);
      const macroAssets = await macroAssetRepo.findByUserId(userId);
      const coreNetworks = await coreNetworkRepo.findByUserId(userId);
      const cashFlows = await cashFlowRepo.findByUserId(userId);

      // 2. Compute Savings & Investments totals from active CoreNetwork nodes
      // Savings includes emergency funds, vaults, sinking funds, buffers, etc.
      // Investments corresponds strictly to INVESTMENTS.
      let totalSavings = 0;
      let totalInvestments = 0;

      for (const node of coreNetworks) {
        if (node.type === 'INVESTMENTS') {
          totalInvestments += node.balance;
        } else if (
          node.type === 'EMERGENCY_FUND' ||
          node.type === 'SAVINGS_VAULT' ||
          node.type === 'PERSONAL_GOAL' ||
          node.type === 'CREDIT_BUFFER'
        ) {
          totalSavings += node.balance;
        }
      }

      // 3. Formulate the last 6 calendar months
      const months: { label: string; year: number; monthIdx: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
          label: d.toLocaleString('en-US', { month: 'short' }),
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
        });
      }

      // Group cash flows by Year-Month
      const cashFlowMap = new Map<string, { inflows: number; outflows: number }>();
      for (const cf of cashFlows) {
        const date = new Date(cf.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const current = cashFlowMap.get(key) || { inflows: 0, outflows: 0 };
        if (cf.type === 'INFLOW') {
          current.inflows += cf.amount;
        } else {
          current.outflows += cf.amount;
        }
        cashFlowMap.set(key, current);
      }

      // 4. Reconstruct net worth history retrospectively
      const currentNetWorth = macroAssets.reduce((sum, asset) => sum + asset.balance, 0);
      let runningNetWorth = currentNetWorth;

      // Extract configurations or fallbacks
      const netSalary = budgetConfig?.netSalary ?? 2500000; // 25,000 PHP (in cents)
      const needsRate = budgetConfig?.needsRate ?? 0.5;
      const wantsRate = budgetConfig?.wantsRate ?? 0.3;
      const savingsRate = budgetConfig?.savingsRate ?? 0.1;
      const investmentsRate = budgetConfig?.investmentsRate ?? 0.1;

      const calculatedPoints: { balance: number; inflow: number; outflow: number }[] = [];

      // Calculate backwards starting from the current month (index 5)
      for (let i = 5; i >= 0; i--) {
        const m = months[i]!;
        const key = `${m.year}-${m.monthIdx}`;
        const actualCf = cashFlowMap.get(key);

        let inflow = 0;
        let outflow = 0;

        if (actualCf && (actualCf.inflows > 0 || actualCf.outflows > 0)) {
          inflow = actualCf.inflows;
          outflow = actualCf.outflows;
        } else {
          inflow = 0;
          outflow = 0;
        }

        const netChange = inflow - outflow;

        calculatedPoints.unshift({
          balance: runningNetWorth,
          inflow,
          outflow,
        });

        // Retrospective balance of the preceding month
        runningNetWorth -= netChange;
      }

      // Build the response trends
      const netWorthTrend = months.map((m, i) => ({
        month: m.label,
        balance: Math.max(0, calculatedPoints[i]!.balance),
      }));

      const cashFlowTrend = months.map((m, i) => ({
        month: m.label,
        inflow: calculatedPoints[i]!.inflow,
        outflow: calculatedPoints[i]!.outflow,
      }));

      // 5. Structure Core Network Balances matching corresponding MacroAsset styles
      const coreNetworkBalances = coreNetworks.map(node => {
        const matchedAsset = macroAssets.find(a => a.id === node.macroAssetId);
        return {
          id: node.id,
          name: node.name,
          type: node.type,
          balance: node.balance,
          colorCode: matchedAsset?.colorCode || '#373737',
          bankName: matchedAsset?.bankName || 'Unknown Bank',
        };
      });

      return ok({
        totalSavings,
        totalInvestments,
        netWorthTrend,
        cashFlowTrend,
        coreNetworkBalances,
        budgetConfig: budgetConfig ? {
          netSalary: budgetConfig.netSalary,
          needsRate: budgetConfig.needsRate,
          wantsRate: budgetConfig.wantsRate,
          savingsRate: budgetConfig.savingsRate,
          investmentsRate: budgetConfig.investmentsRate,
        } : null,
      });
    } catch (error) {
      logger.error(`[AnalyticsService.getAnalyticsData] DB_ERROR:`, error);
      return err('DB_ERROR');
    }
  }
}
