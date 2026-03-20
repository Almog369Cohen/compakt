/**
 * Environment validation utilities
 */
import { z } from "zod";

const urlString = z.string().url();

// Required env vars — app won't function without these
const requiredEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Optional groups with feature flags
const optionalGroups = {
  app: { keys: ["NEXT_PUBLIC_APP_URL"] as const, label: "App URL" },
  clerk: { keys: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] as const, label: "Clerk auth" },
  gmail: { keys: ["GMAIL_USER", "GMAIL_APP_PASSWORD"] as const, label: "Email OTP" },
  spotify: { keys: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_TOKEN_ENCRYPTION_KEY"] as const, label: "Spotify" },
  gcal: { keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const, label: "Google Calendar" },
} as const;

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required vars with Zod
  const parsed = requiredEnv.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".")}: ${issue.message}`);
    }
  }

  // Check optional groups
  for (const [, group] of Object.entries(optionalGroups)) {
    const missing = group.keys.filter((k) => !process.env[k]);
    if (missing.length > 0 && missing.length < group.keys.length) {
      warnings.push(`${group.label}: partial config — missing ${missing.join(", ")}`);
    } else if (missing.length === group.keys.length) {
      warnings.push(`${group.label}: not configured — ${group.label} features disabled`);
    }
  }

  // URL format sanity check for APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      if (url.hostname === "localhost" && process.env.NODE_ENV === "production") {
        errors.push("NEXT_PUBLIC_APP_URL points to localhost in production");
      }
    } catch {
      errors.push("NEXT_PUBLIC_APP_URL is not a valid URL");
    }
  }

  const result: EnvValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
  };

  // Log validation results
  if (errors.length > 0) {
    console.error("❌ Environment validation errors:", errors);
  }
  if (warnings.length > 0) {
    console.warn("⚠️ Environment validation warnings:", warnings);
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ Environment validation passed");
  }

  return result;
}

export function isSpotifyEnabled(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY);
}

export function isGmailEnabled(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export function isClerkEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}
