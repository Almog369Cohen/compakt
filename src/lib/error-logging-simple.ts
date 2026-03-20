import type { SupabaseClient } from "@supabase/supabase-js";

export interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  profile_id?: string;
  component?: string;
  action?: string;
  context?: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
}

export interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  checks: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    api: boolean;
  };
  last_check: string;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private supabase: SupabaseClient;
  private context: Record<string, unknown> = {};

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  static getInstance(supabase?: SupabaseClient): ErrorLogger {
    if (!ErrorLogger.instance) {
      if (!supabase) {
        throw new Error("Supabase client required for first initialization");
      }
      ErrorLogger.instance = new ErrorLogger(supabase);
    }
    return ErrorLogger.instance;
  }

  setContext(context: Record<string, unknown>) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  async logError(error: Error | string, options: {
    errorType?: string;
    component?: string;
    action?: string;
    context?: Record<string, unknown>;
    userId?: string;
    profileId?: string;
  } = {}) {
    try {
      const errorMessage = typeof error === "string" ? error : error.message;
      const stackTrace = typeof error === "string" ? undefined : error.stack;

      const errorData = {
        error_type: options.errorType || "client_error",
        error_message: errorMessage,
        stack_trace: stackTrace,
        user_id: options.userId,
        profile_id: options.profileId,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        component: options.component,
        action: options.action,
        context: { ...this.context, ...options.context },
        resolved: false,
      };

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("🔴 Error logged:", errorData);
      }

      // Try to log to database
      const { error: dbError } = await this.supabase
        .from("error_logs")
        .insert(errorData);

      if (dbError) {
        console.error("Failed to log error to database:", dbError);
      }
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
    }
  }

  async getRecentErrors(limit: number = 50): Promise<ErrorLog[]> {
    try {
      const { data, error } = await this.supabase
        .from("error_logs")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to get recent errors:", error);
      return [];
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const checks = {
        database: await this.checkDatabase(),
        auth: await this.checkAuth(),
        storage: await this.checkStorage(),
        api: await this.checkAPI(),
      };

      const failedChecks = Object.values(checks).filter(check => !check).length;
      const totalChecks = Object.keys(checks).length;

      let status: "healthy" | "warning" | "critical";
      if (failedChecks === 0) {
        status = "healthy";
      } else if (failedChecks <= totalChecks / 2) {
        status = "warning";
      } else {
        status = "critical";
      }

      return {
        status,
        checks,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to get system health:", error);
      return {
        status: "critical",
        checks: {
          database: false,
          auth: false,
          storage: false,
          api: false,
        },
        last_check: new Date().toISOString(),
      };
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id")
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }

  private async checkStorage(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from("dj-media")
        .list("", { limit: 1 });

      return !error;
    } catch {
      return false;
    }
  }

  private async checkAPI(): Promise<boolean> {
    try {
      const response = await fetch("/api/health");
      return response.ok;
    } catch {
      return false;
    }
  }

  async resolveError(errorId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("error_logs")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", errorId);

      return !error;
    } catch (error) {
      console.error("Failed to resolve error:", error);
      return false;
    }
  }
}

// React hook for error logging
export function useErrorLogger(supabase: SupabaseClient) {
  const logger = ErrorLogger.getInstance(supabase);

  return {
    logError: logger.logError.bind(logger),
    setContext: logger.setContext.bind(logger),
    clearContext: logger.clearContext.bind(logger),
    getRecentErrors: logger.getRecentErrors.bind(logger),
    getSystemHealth: logger.getSystemHealth.bind(logger),
    resolveError: logger.resolveError.bind(logger),
  };
}
