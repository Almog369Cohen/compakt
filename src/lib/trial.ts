import type { SupabaseClient } from "@supabase/supabase-js";

export interface TrialPeriod {
  id: string;
  profile_id: string;
  plan_key: "starter" | "pro" | "premium" | "enterprise";
  trial_started_at: string;
  trial_ends_at: string;
  trial_extended_at: string | null;
  trial_extensions_count: number;
  is_active: boolean;
  converted_to_paid: boolean;
  converted_at: string | null;
  trial_source: "self_signup" | "admin_created" | "coupon_triggered" | "referral";
  usage_events_count: number;
  max_events_allowed: number;
  created_at: string;
  updated_at: string;
}

export interface TrialStatus {
  has_trial: boolean;
  trial_id?: string;
  plan_key?: string;
  started_at?: string;
  ends_at?: string;
  days_remaining?: number;
  events_used?: number;
  events_limit?: number;
  extensions_used?: number;
  can_extend?: boolean;
  status: "no_trial" | "active" | "expiring_soon" | "expired";
}

export interface TrialEvent {
  id: string;
  trial_id: string;
  event_type: "started" | "extended" | "reminder_sent" | "expired" | "converted" | "cancelled";
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface TrialSettings {
  default_trial_days: number;
  max_extensions: number;
  extension_days: number;
  reminder_schedule: number[];
  auto_convert_enabled: boolean;
  trial_events_limit: number;
}

export async function startTrial(
  service: SupabaseClient,
  profileId: string,
  planKey: "starter" | "pro" | "premium" | "enterprise" = "pro",
  trialDays: number = 14,
  source: "self_signup" | "admin_created" | "coupon_triggered" | "referral" = "self_signup"
): Promise<{ trialId: string; success: boolean; error?: string }> {
  try {
    const { data, error } = await service.rpc("start_trial", {
      p_profile_id: profileId,
      p_plan_key: planKey,
      p_trial_days: trialDays,
      p_source: source,
    });

    if (error) throw error;

    return {
      trialId: data,
      success: true,
    };
  } catch (error) {
    return {
      trialId: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to start trial",
    };
  }
}

export async function extendTrial(
  service: SupabaseClient,
  trialId: string,
  extensionDays: number = 7
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await service.rpc("extend_trial", {
      p_trial_id: trialId,
      p_extension_days: extensionDays,
    });

    if (error) throw error;

    return {
      success: Boolean(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extend trial",
    };
  }
}

export async function convertTrialToPaid(
  service: SupabaseClient,
  trialId: string,
  planKey: "starter" | "pro" | "premium" | "enterprise"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await service.rpc("convert_trial_to_paid", {
      p_trial_id: trialId,
      p_plan_key: planKey,
    });

    if (error) throw error;

    return {
      success: Boolean(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert trial",
    };
  }
}

export async function checkTrialStatus(
  service: SupabaseClient,
  profileId: string
): Promise<TrialStatus> {
  try {
    const { data, error } = await service.rpc("check_trial_status", {
      p_profile_id: profileId,
    });

    if (error) throw error;

    return data as TrialStatus;
  } catch (error) {
    console.error("Error checking trial status:", error);
    return {
      has_trial: false,
      status: "no_trial",
    };
  }
}

export async function getTrialSettings(
  service: SupabaseClient
): Promise<Partial<TrialSettings>> {
  try {
    const { data, error } = await service
      .from("trial_settings")
      .select("setting_key, setting_value");

    if (error) throw error;

    const settings: Partial<TrialSettings> = {};
    data?.forEach((setting) => {
      (settings as any)[setting.setting_key] = setting.setting_value;
    });

    return settings;
  } catch (error) {
    console.error("Error getting trial settings:", error);
    return {};
  }
}

export async function getUserTrials(
  service: SupabaseClient,
  profileId: string
): Promise<TrialPeriod[]> {
  try {
    const { data, error } = await service
      .from("trial_periods")
      .select("*")
      .eq("profile_id", profileId)
      .order("trial_started_at", { ascending: false });

    if (error) throw error;

    return (data || []) as TrialPeriod[];
  } catch (error) {
    console.error("Error getting user trials:", error);
    return [];
  }
}

export async function getTrialEvents(
  service: SupabaseClient,
  trialId: string
): Promise<TrialEvent[]> {
  try {
    const { data, error } = await service
      .from("trial_events")
      .select("*")
      .eq("trial_id", trialId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []) as TrialEvent[];
  } catch (error) {
    console.error("Error getting trial events:", error);
    return [];
  }
}

export async function updateTrialSettings(
  service: SupabaseClient,
  settings: Partial<TrialSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
    }));

    const { error } = await service
      .from("trial_settings")
      .upsert(updates, { onConflict: "setting_key" });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

// Helper functions for trial management
export function getTrialDaysRemaining(trialEndsAt: string): number {
  const ends = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = ends.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getTrialStatusText(status: TrialStatus["status"]): string {
  switch (status) {
    case "active":
      return "פעיל";
    case "expiring_soon":
      return "פג תוקף בקרוב";
    case "expired":
      return "פג תוקף";
    case "no_trial":
      return "ללא ניסיון";
    default:
      return "לא ידוע";
  }
}

export function getTrialStatusColor(status: TrialStatus["status"]): string {
  switch (status) {
    case "active":
      return "text-green-600";
    case "expiring_soon":
      return "text-yellow-600";
    case "expired":
      return "text-red-600";
    case "no_trial":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
}

export function canStartTrial(trials: TrialPeriod[]): boolean {
  const activeTrial = trials.find(
    (t) => t.is_active && new Date(t.trial_ends_at) > new Date()
  );
  return !activeTrial;
}

export function getTrialUsagePercentage(eventsUsed: number, eventsLimit: number): number {
  return Math.min((eventsUsed / eventsLimit) * 100, 100);
}
