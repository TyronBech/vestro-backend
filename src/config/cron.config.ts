/**
 * Configuration for background cron tasks in the Vestro application.
 * You can modify the standard cron expressions below to adjust when
 * notifications and automated tasks are triggered.
 * 
 * Cron expressions are used to schedule tasks to run at specific times.
 * A cron expression consists of 5 fields separated by spaces:
 * 
 * * → first field : every minute
 * * → second field : every hour
 * * → third field : every day of the month
 * * → fourth field : every month
 * * → fifth field : every day of the week
*/

export const CRON_CONFIG = {
  /**
   * Credit Due Tomorrow Checker
   * Default: Runs daily at 8:00 AM (0 8 * * *)
   */
  CREDIT_DUE_CHECK: '0 8 * * *',

  /**
   * Pipeline C: Wants Sweep Reminder (Fires 24h before paycheck)
   * If payday is on the 15th and 30th, we remind the user on the 14th and 29th.
   * Default: Runs at 8:00 AM on the 14th and 29th of every month (0 8 14,29 * *)
   */
  WANTS_SWEEP_REMINDER: '0 8 14,29 * *',

  /**
   * Cash Flow Input Reminder
   * Reminds the user to log transactions (addition/deductions) so they don't forget.
   * Default: Runs every Tuesday and Thursday at 7:00 PM (0 19 * * 2,4)
   */
  CASH_FLOW_REMINDER: '0 19 * * 2,4',
};
