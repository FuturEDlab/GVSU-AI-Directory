/**
 * Utility functions and assertion helpers for LakerAI Directory test suite.
 */

export interface TestResult {
  name: string;
  category: 'unit' | 'component' | 'integration' | 'e2e' | 'performance';
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'NOT RUN';
  durationMs: number;
  lastRun: string;
  error?: string;
}

export async function measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

export function measureSync<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}
