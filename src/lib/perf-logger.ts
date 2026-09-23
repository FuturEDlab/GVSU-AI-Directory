/**
 * Lightweight development performance measurement utility for Admin Portal optimization.
 * Does not add external analytics dependencies.
 */

export const perfLog = (label: string, startTime?: number, meta?: Record<string, any>) => {
  if (process.env.NODE_ENV !== 'production') {
    if (startTime !== undefined) {
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`⏱️ [AdminPerf] ${label}: ${duration}ms`, meta ? meta : '');
    } else {
      console.log(`⏱️ [AdminPerf] ${label}`, meta ? meta : '');
    }
  }
};
