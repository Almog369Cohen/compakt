"use client";

import { useState } from "react";
import { CheckSquare, Square, UserCheck, UserX, Shield, Save } from "lucide-react";
import { ROLE_KEYS, PLAN_KEYS, type RoleKey, type PlanKey } from "@/lib/access";

interface BulkActionsProps {
  selectedIds: Set<string>;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkUpdate: (updates: BulkUpdateData) => Promise<void>;
  canManageRoles: boolean;
}

export interface BulkUpdateData {
  role?: RoleKey;
  plan?: PlanKey;
  is_active?: boolean;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkUpdate,
  canManageRoles,
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [bulkData, setBulkData] = useState<BulkUpdateData>({});

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;

  const handleBulkUpdate = async () => {
    if (!hasSelection || Object.keys(bulkData).length === 0) return;

    setIsProcessing(true);
    try {
      await onBulkUpdate(bulkData);
      setBulkData({});
      setShowActions(false);
      onDeselectAll();
    } catch (error) {
      console.error("Bulk update failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickActions = [
    {
      icon: UserCheck,
      label: "הפעל",
      color: "text-brand-green",
      action: () => onBulkUpdate({ is_active: true }),
    },
    {
      icon: UserX,
      label: "השהה",
      color: "text-yellow-400",
      action: () => onBulkUpdate({ is_active: false }),
    },
  ];

  return (
    <div className="glass-card p-3 mb-4">
      <div className="flex items-center gap-3">
        {/* Select All Toggle */}
        <button
          onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          title={selectedCount === totalCount ? "בטל בחירה" : "בחר הכל"}
        >
          {selectedCount === totalCount ? (
            <CheckSquare className="w-5 h-5 text-brand-blue" />
          ) : (
            <Square className="w-5 h-5 text-muted" />
          )}
        </button>

        {/* Selection Count */}
        {hasSelection ? (
          <>
            <span className="text-sm font-medium">
              {selectedCount} נבחרו
            </span>

            <div className="h-5 w-px bg-glass" />

            {/* Quick Actions */}
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsProcessing(true);
                  action.action().finally(() => setIsProcessing(false));
                }}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs ${action.color}`}
                title={action.label}
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}

            {/* Advanced Actions Toggle */}
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              עוד פעולות
            </button>

            {/* Deselect All */}
            <button
              onClick={onDeselectAll}
              className="mr-auto text-xs text-muted hover:text-foreground transition-colors"
            >
              בטל בחירה
            </button>
          </>
        ) : (
          <span className="text-sm text-muted">בחר משתמשים לפעולות מרובות</span>
        )}
      </div>

      {/* Advanced Actions Panel */}
      {showActions && hasSelection && (
        <div className="mt-3 pt-3 border-t border-glass space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Role Update */}
            {canManageRoles && (
              <div>
                <label className="text-xs text-muted mb-1.5 block">שינוי תפקיד</label>
                <select
                  value={bulkData.role || ""}
                  onChange={(e) => setBulkData({ ...bulkData, role: e.target.value as RoleKey || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass text-sm"
                >
                  <option value="">בחר תפקיד...</option>
                  {ROLE_KEYS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Plan Update */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">שינוי תוכנית</label>
              <select
                value={bulkData.plan || ""}
                onChange={(e) => setBulkData({ ...bulkData, plan: e.target.value as PlanKey || undefined })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass text-sm"
              >
                <option value="">בחר תוכנית...</option>
                {PLAN_KEYS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Update */}
            <div>
              <label className="text-xs text-muted mb-1.5 block">שינוי סטטוס</label>
              <select
                value={bulkData.is_active === undefined ? "" : bulkData.is_active.toString()}
                onChange={(e) =>
                  setBulkData({
                    ...bulkData,
                    is_active: e.target.value === "" ? undefined : e.target.value === "true",
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-glass text-sm"
              >
                <option value="">בחר סטטוס...</option>
                <option value="true">פעיל</option>
                <option value="false">מושהה</option>
              </select>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted">
              {Object.keys(bulkData).length > 0 ? (
                <span>
                  שינויים: {Object.keys(bulkData).length} • יחול על {selectedCount} משתמשים
                </span>
              ) : (
                <span>בחר שינויים להחלה</span>
              )}
            </div>
            <button
              onClick={handleBulkUpdate}
              disabled={isProcessing || Object.keys(bulkData).length === 0}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isProcessing ? "מעדכן..." : "החל שינויים"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
