import { Page } from '@playwright/test';

interface WaitOptions {
  timeout: number; // in milliseconds
  message: string; // custom failure context
}

/**
 * Intelligent polling wait condition.
 * Evaluates a condition callback every 500ms until it returns true or times out.
 * Safe from 'page.waitForTimeout' anti-patterns.
 * 
 * @param page Active Playwright page object instance
 * @param condition Evaluator callback yielding a boolean promise
 * @param options Target timeout and error message settings
 */
export async function waitForCondition(
  page: Page,
  condition: () => Promise<boolean>,
  options: WaitOptions
): Promise<void> {
  const { timeout, message } = options;
  const pollInterval = 500; // poll every 500ms
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const isMet = await condition();
      if (isMet) {
        return; // Success! Condition satisfied
      }
    } catch (err: any) {
      // Absorb errors mid-poll (e.g. element detached errors) and try again
      console.debug(`[Wait Poller] Intercepted transient check error: ${err.message}`);
    }

    // Standard sleep, bypassing Playwright page-level timer dependencies
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Raise standard QA execution failure
  throw new Error(
    `❌ [Timeout Error] Failed to meet condition within ${timeout}ms.\n` +
    `Reason: ${message}\n`
  );
}
