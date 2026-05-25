import { ZodSchema, ZodError } from 'zod';

/**
 * Parses and verifies an API response shape against a strict Zod schema.
 * Throws a detailed ZodError on parsing failure.
 * 
 * @param data Response payload received from the endpoint
 * @param schema target Zod specification validation object
 */
export function assertResponseSchema<T>(data: unknown, schema: ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ [Schema Assert Failure] Received invalid payload shape:', error.format());
      throw error;
    }
    throw new Error(`❌ [Schema Assert Failure] Unexpected verification error: ${error}`);
  }
}

/**
 * Asserts that the execution duration of an API transaction was within constraints.
 * Throws a descriptive timing error if the execution takes longer than expected.
 * 
 * @param startMs Timestamp in ms when the call was launched (e.g. from Date.now())
 * @param maxMs Maximum acceptable execution latency
 * @param label Endpoint identifier or action description
 */
export function assertResponseTime(startMs: number, maxMs: number, label: string): void {
  const duration = Date.now() - startMs;
  if (duration > maxMs) {
    throw new Error(
      `❌ [Latency Assert Failure] REST action "${label}" exceeded acceptable boundaries.\n` +
      `  - Actual Latency: ${duration}ms\n` +
      `  - Limit Constraint: ${maxMs}ms\n`
    );
  }
  console.log(`⏱️ [Latency Checked] Action "${label}" responded in ${duration}ms (acceptable limit: ${maxMs}ms).`);
}
