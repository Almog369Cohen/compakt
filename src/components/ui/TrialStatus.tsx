"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TrialStatus } from "@/lib/trial";

interface TrialStatusProps {
  profileId: string;
  className?: string;
  showExtendButton?: boolean;
  compact?: boolean;
}

export function TrialStatus({
  profileId,
  className,
  showExtendButton = true,
  compact = false
}: TrialStatusProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrialStatus();
  }, [profileId]);

  const loadTrialStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trials/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load trial status");
      }

      setTrialStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trial status");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!trialStatus?.trial_id) return;

    try {
      setExtending(true);
      setError(null);

      const response = await fetch("/api/trials/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trialId: trialStatus.trial_id,
          extensionDays: 7
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extend trial");
      }

      // Reload trial status
      await loadTrialStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend trial");
    } finally {
      setExtending(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("glass-card p-4 animate-pulse", className)}>
        <div className="h-4 bg-glass rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-glass rounded w-1/2"></div>
      </div>
    );
  }

  if (!trialStatus || !trialStatus.has_trial) {
    return (
      <div className={cn("glass-card p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium">אין תקופת ניסיון פעילה</p>
            <p className="text-sm text-muted">התחל תקופת ניסיון בחינם</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = cn(
    "text-sm font-medium",
    trialStatus.status === "active" && "text-green-600",
    trialStatus.status === "expiring_soon" && "text-yellow-600",
    trialStatus.status === "expired" && "text-red-600"
  );

  const StatusIcon = trialStatus.status === "active" ? CheckCircle :
    trialStatus.status === "expiring_soon" ? AlertCircle :
      AlertCircle;

  const usagePercentage = (trialStatus.events_limit || 0) > 0
    ? (trialStatus.events_used || 0) / (trialStatus.events_limit || 1) * 100
    : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <StatusIcon className={cn("w-4 h-4", statusColor)} />
        <span className={statusColor}>
          ניסיון: {trialStatus.days_remaining || 0} ימים נותרו
        </span>
        {usagePercentage > 80 && (
          <span className="text-yellow-600">({Math.round(usagePercentage)}% מהאירועים)</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            trialStatus.status === "active" && "bg-green-100",
            trialStatus.status === "expiring_soon" && "bg-yellow-100",
            trialStatus.status === "expired" && "bg-red-100"
          )}>
            <StatusIcon className={cn(
              "w-5 h-5",
              trialStatus.status === "active" && "text-green-600",
              trialStatus.status === "expiring_soon" && "text-yellow-600",
              trialStatus.status === "expired" && "text-red-600"
            )} />
          </div>
          <div>
            <p className="font-medium">תקופת ניסיון - {trialStatus.plan_key?.toUpperCase()}</p>
            <p className={statusColor}>
              {trialStatus.status === "active" && `${trialStatus.days_remaining || 0} ימים נותרו`}
              {trialStatus.status === "expiring_soon" && `פג תוקף בעוד ${trialStatus.days_remaining || 0} ימים`}
              {trialStatus.status === "expired" && "פג תוקף"}
            </p>
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      {(trialStatus.events_limit || 0) > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>שימוש באירועים</span>
            <span>{trialStatus.events_used || 0} / {trialStatus.events_limit || 0}</span>
          </div>
          <div className="w-full bg-glass rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                usagePercentage < 50 && "bg-green-500",
                usagePercentage >= 50 && usagePercentage < 80 && "bg-yellow-500",
                usagePercentage >= 80 && "bg-red-500"
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {usagePercentage > 80 && (
            <p className="text-xs text-yellow-600 mt-1">
              מתקרב למגבלת האירועים
            </p>
          )}
        </div>
      )}

      {/* Trial Info */}
      <div className="grid grid-cols-2 gap-4 text-xs text-muted mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>התחלה: {new Date(trialStatus.started_at || "").toLocaleDateString("he-IL")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>סיום: {new Date(trialStatus.ends_at || "").toLocaleDateString("he-IL")}</span>
        </div>
      </div>

      {/* Extend Button */}
      {showExtendButton && trialStatus.can_extend && trialStatus.status !== "expired" && (
        <button
          onClick={handleExtendTrial}
          disabled={extending}
          className="w-full btn-primary text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {extending ? "מאריך תקופת ניסיון..." : "הארך תקופת ניסיון (+7 ימים)"}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Upgrade CTA for expired trials */}
      {trialStatus.status === "expired" && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">תקופת הניסיון שלך פגה</p>
          <button className="w-full btn-primary text-sm">
            שדרג לחבילה בתשלום
          </button>
        </div>
      )}
    </div>
  );
}
