import cron from 'node-cron';
import { CRON_CONFIG } from '../config/cron.config';
import { CreditCardRepositoryPg } from '../infrastructure/db/credit-card.repository.pg';
import { UserRepositoryPg } from '../infrastructure/db/user.repository.pg';
import { NotificationService } from './notification.service';
import { SweepService } from './sweep.service';
import { logger } from '../utils/logger';

const cardRepo = new CreditCardRepositoryPg();
const userRepo = new UserRepositoryPg();

export class SchedulerService {
  private static activeJobs: cron.ScheduledTask[] = [];

  static initialize(): void {
    logger.info('Initializing SchedulerService background tasks...');

    // 1. Credit Due Checker Job
    const creditDueJob = cron.schedule(CRON_CONFIG.CREDIT_DUE_CHECK, async () => {
      logger.info('Starting scheduled Credit Due Tomorrow check...');
      try {
        await this.runCreditDueCheck();
      } catch (error) {
        logger.error('Error executing runCreditDueCheck scheduler:', error);
      }
    });
    this.activeJobs.push(creditDueJob);

    // 2. Wants Sweep Reminder Job
    const wantsSweepJob = cron.schedule(CRON_CONFIG.WANTS_SWEEP_REMINDER, async () => {
      logger.info('Starting scheduled Wants Sweep reminder check...');
      try {
        await this.runWantsSweepReminder();
      } catch (error) {
        logger.error('Error executing runWantsSweepReminder scheduler:', error);
      }
    });
    this.activeJobs.push(wantsSweepJob);

    // 3. Cash Flow Input Reminder Job
    const cashFlowReminderJob = cron.schedule(CRON_CONFIG.CASH_FLOW_REMINDER, async () => {
      logger.info('Starting scheduled Cash Flow input reminder...');
      try {
        await this.runCashFlowReminder();
      } catch (error) {
        logger.error('Error executing runCashFlowReminder scheduler:', error);
      }
    });
    this.activeJobs.push(cashFlowReminderJob);

    logger.info(`SchedulerService initialized with ${this.activeJobs.length} active jobs.`);
  }

  /**
   * Scans for credit cards due tomorrow and alerts users with outstanding balances.
   */
  static async runCreditDueCheck(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate(); // 1 - 31

    logger.info(`Checking credit cards due on day: ${tomorrowDay}`);
    const cards = await cardRepo.findByDueDay(tomorrowDay);
    logger.info(`Found ${cards.length} cards due on day: ${tomorrowDay}`);

    for (const card of cards) {
      const effectiveSpend = card.unbilledSpend - card.midCyclePaid;
      if (effectiveSpend > 0) {
        const formattedAmount = (effectiveSpend / 100).toFixed(2);
        const title = 'Credit Card Due Tomorrow';
        const body = `Your card "${card.cardName}" has an outstanding balance of ₱${formattedAmount} due tomorrow.`;
        const data = { type: 'CREDIT_DUE', cardId: card.id, amount: effectiveSpend };

        await NotificationService.sendToUser(card.userId, title, body, data);
      }
    }
  }

  /**
   * Reminds users that Wants Sweep runs tomorrow. Checks if their Wants sandbox has balance.
   */
  static async runWantsSweepReminder(): Promise<void> {
    const users = await userRepo.findAll();
    for (const user of users) {
      const readinessResult = await SweepService.getSweepReadiness(user.id);
      if (readinessResult.ok && readinessResult.value.isReady && readinessResult.value.sourceAsset) {
        const balance = readinessResult.value.availableToSweep;
        const formattedAmount = (balance / 100).toFixed(2);
        const title = 'Wants Sweep Tomorrow';
        const body = `Your Wants Sweep executes tomorrow! You have ₱${formattedAmount} of unspent lifestyle cash in your Wants Sandbox ready to be swept.`;
        const data = { type: 'WANTS_SWEEP_REMINDER', amount: balance };

        await NotificationService.sendToUser(user.id, title, body, data);
      }
    }
  }

  /**
   * Reminds all users to log any cash flows so they do not forget.
   */
  static async runCashFlowReminder(): Promise<void> {
    const users = await userRepo.findAll();
    const defaultPrompt = "Did you spend cash or swipe today? Don't forget to log your cash flows in Vestro!";
    const prompts = [
      defaultPrompt,
      "Keep your Macro Constraints accurate! Update your latest cash flows now.",
      "A quick update keeps the system precise. Log any spent Wants or cash flow adjustments.",
      "Friendly reminder: Log any additions or deductions to keep your budget dashboard in sync!"
    ];

    for (const user of users) {
      // Pick a random prompt
      const prompt = prompts[Math.floor(Math.random() * prompts.length)] ?? defaultPrompt;
      const title = 'Update Your Cash Flow';
      const data = { type: 'CASH_FLOW_REMINDER' };

      await NotificationService.sendToUser(user.id, title, prompt, data);
    }
  }

  static stopAll(): void {
    logger.info('Stopping all scheduler jobs...');
    for (const job of this.activeJobs) {
      job.stop();
    }
    this.activeJobs = [];
  }
}
