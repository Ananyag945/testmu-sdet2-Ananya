/**
 * Executes an asynchronous function, retrying with exponential backoff if it fails.
 * @param fn Asynchronous callback function to run
 * @param maxAttempts Max number of attempts before throwing
 * @param delayMs Base delay duration in milliseconds
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  let currentDelay = delayMs;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      return await fn();
    } catch (error: any) {
      if (attempt >= maxAttempts) {
        console.error(`❌ [Retry Failure] All ${maxAttempts} attempts failed. Throwing final exception.`);
        throw error;
      }

      console.warn(
        `⚠️ [Retry Warning] Attempt ${attempt}/${maxAttempts} failed. ` +
        `Error: ${error?.message || error}. Retrying in ${currentDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2; // Double delay on each backoff iteration
    }
  }

  throw new Error('Unreachable code reached in retryWithBackoff helper');
}
