"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, Clock, TrendingUp, Plus, Eye, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type TrialPeriod, type TrialEvent } from "@/lib/trial";

interface TrialManagerProps {
  className?: string;
}

export function TrialManager({ className }: TrialManagerProps) {
  const [trials, setTrials] = useState<TrialPeriod[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<TrialPeriod | null>(null);
  const [trialEvents, setTrialEvents] = useState<TrialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrials();
  }, []);

  const loadTrials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hq/trials");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load trials");
      }

      setTrials(data.trials || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trials");
    } finally {
      setLoading(false);
    }
  };

  const loadTrialEvents = async (trialId: string) => {
    try {
      setEventsLoading(true);
      const response = await fetch(`/api/hq/trials/${trialId}/events`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load trial events");
      }

      setTrialEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trial events");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSelectTrial = (trial: TrialPeriod) => {
    setSelectedTrial(trial);
    loadTrialEvents(trial.id);
  };

  const getTrialStatusColor = (trial: TrialPeriod) => {
    if (!trial.is_active) return "text-gray-600";

    const daysRemaining = Math.ceil((new Date(trial.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return "text-red-600";
    if (daysRemaining <= 3) return "text-yellow-600";
    return "text-green-600";
  };

  const getTrialStatusText = (trial: TrialPeriod) => {
    if (!trial.is_active) return trial.converted_to_paid ? "הומר לתשלום" : "לא פעיל";

    const daysRemaining = Math.ceil((new Date(trial.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return "פג תוקף";
    if (daysRemaining <= 3) return `פג תוקף בעוד ${daysRemaining} ימים`;
    return `פעיל (${daysRemaining} ימים נותרו)`;
  };

  const getUsagePercentage = (trial: TrialPeriod) => {
    if (!trial.max_events_allowed) return 0;
    return Math.min((trial.usage_events_count / trial.max_events_allowed) * 100, 100);
  };

  if (loading) {
    return (
      <div className={cn("glass-card p-6 animate-pulse", className)}>
        <div className="h-6 bg-glass rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-glass rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          ניהול תקופות ניסיון
        </h2>
        <div className="text-sm text-muted">
          {trials.length} תקופות ניסיון סך הכל
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trials List */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted mb-3">רשימת תקופות ניסיון</h3>
          {trials.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>אין תקופות ניסיון פעילות</p>
            </div>
          ) : (
            trials.map((trial) => (
              <div
                key={trial.id}
                className={cn(
                  "glass-card p-4 cursor-pointer transition-all hover:bg-white/5",
                  selectedTrial?.id === trial.id && "ring-2 ring-brand-blue"
                )}
                onClick={() => handleSelectTrial(trial)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{trial.plan_key.toUpperCase()}</p>
                    <p className={cn("text-sm", getTrialStatusColor(trial))}>
                      {getTrialStatusText(trial)}
                    </p>
                  </div>
                  <div className="text-xs text-muted text-left">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(trial.trial_started_at).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                </div>

                {/* Usage Progress */}
                {trial.max_events_allowed > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>שימוש באירועים</span>
                      <span>{trial.usage_events_count} / {trial.max_events_allowed}</span>
                    </div>
                    <div className="w-full bg-glass rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          getUsagePercentage(trial) < 50 && "bg-green-500",
                          getUsagePercentage(trial) >= 50 && getUsagePercentage(trial) < 80 && "bg-yellow-500",
                          getUsagePercentage(trial) >= 80 && "bg-red-500"
                        )}
                        style={{ width: `${getUsagePercentage(trial)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>מקור: {trial.trial_source}</span>
                  {trial.trial_extensions_count > 0 && (
                    <span>הרחבות: {trial.trial_extensions_count}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Trial Details */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted mb-3">פרטי תקופת ניסיון</h3>
          {selectedTrial ? (
            <div className="glass-card p-4 space-y-4">
              <div>
                <p className="font-medium text-lg">{selectedTrial.plan_key.toUpperCase()}</p>
                <p className={cn("text-sm", getTrialStatusColor(selectedTrial))}>
                  {getTrialStatusText(selectedTrial)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted mb-1">תאריך התחלה</p>
                  <p className="font-medium">
                    {new Date(selectedTrial.trial_started_at).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <div>
                  <p className="text-muted mb-1">תאריך סיום</p>
                  <p className="font-medium">
                    {new Date(selectedTrial.trial_ends_at).toLocaleDateString("he-IL")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted mb-1">אירועים בשימוש</p>
                  <p className="font-medium">{selectedTrial.usage_events_count}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">מגבלת אירועים</p>
                  <p className="font-medium">{selectedTrial.max_events_allowed}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted mb-1">מקור ניסיון</p>
                  <p className="font-medium">{selectedTrial.trial_source}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">הרחבות</p>
                  <p className="font-medium">{selectedTrial.trial_extensions_count}</p>
                </div>
              </div>

              {selectedTrial.converted_to_paid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ הומר לחבילה בתשלום ב-{new Date(selectedTrial.converted_at || "").toLocaleDateString("he-IL")}
                  </p>
                </div>
              )}

              {/* Trial Events */}
              <div>
                <p className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  אירועי ניסיון
                </p>
                {eventsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-glass rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : trialEvents.length === 0 ? (
                  <p className="text-sm text-muted">אין אירועים מתועדים</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {trialEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between text-xs p-2 bg-glass/50 rounded">
                        <span className="font-medium">{event.event_type}</span>
                        <span className="text-muted">
                          {new Date(event.created_at).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-muted">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>בחר תקופת ניסיון כדי לצפות בפרטים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
