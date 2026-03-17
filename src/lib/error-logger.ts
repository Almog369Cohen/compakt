/**
 * Client-side error logger
 * Sends errors to our custom Supabase error tracking
 */

type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

interface LogErrorOptions {
  error: Error | string;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  userId?: string;
}

export async function logError({
  error,
  severity = 'medium',
  context = {},
}: LogErrorOptions): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = error instanceof Error ? error.name : 'Error';
    
    const payload = {
      error_message: errorMessage,
      error_stack: errorStack,
      error_type: errorType,
      page_url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      severity,
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    };
    
    // Send to our API
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Logger]', {
        message: errorMessage,
        severity,
        context,
      });
    }
  } catch (err) {
    // Fallback to console if logging fails
    console.error('Failed to log error:', err);
    console.error('Original error:', error);
  }
}

/**
 * Log critical error (blocks core functionality)
 */
export function logCritical(error: Error | string, context?: Record<string, any>) {
  return logError({ error, severity: 'critical', context });
}

/**
 * Log high severity error (important but has workaround)
 */
export function logHigh(error: Error | string, context?: Record<string, any>) {
  return logError({ error, severity: 'high', context });
}

/**
 * Log medium severity error (UX issue)
 */
export function logMedium(error: Error | string, context?: Record<string, any>) {
  return logError({ error, severity: 'medium', context });
}

/**
 * Log low severity error (cosmetic)
 */
export function logLow(error: Error | string, context?: Record<string, any>) {
  return logError({ error, severity: 'low', context });
}

/**
 * Setup global error handler
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;
  
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    logError({
      error: event.error || event.message,
      severity: 'high',
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      error: event.reason,
      severity: 'high',
      context: {
        type: 'unhandled_rejection',
      },
    });
  });
}
