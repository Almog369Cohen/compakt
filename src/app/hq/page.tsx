"use client";

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/stores/adminStore";
import { motion } from "framer-motion";
import { LogOut, Users, Activity, Shield, RefreshCw, Save, History, ChevronDown, ChevronUp, ChevronLeft, Download, BarChart3, Calendar, Tag } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FEATURE_KEYS, PLAN_KEYS, ROLE_KEYS, type FeatureKey, type PlanKey, type RoleKey } from "@/lib/access";
import { UserFilters, type UserFiltersState } from "@/components/hq/UserFilters";
import { BulkActions, type BulkUpdateData } from "@/components/hq/BulkActions";
import { DashboardStats } from "@/components/hq/Analytics/DashboardStats";
import { TrialManager } from "@/components/admin/TrialManager";
import { CouponManager } from "@/components/admin/CouponManager";

interface ProfileRow {
  id: string;
  user_id: string | null;
  business_name: string;
  dj_slug: string | null;
  role: string;
  email: string | null;
  plan: string;
  is_active: boolean;
  feature_overrides: Partial<Record<FeatureKey, boolean>>;
  notes: string | null;
  created_at: string;
  access: {
    role: string;
    plan: string;
    isActive: boolean;
    features: Record<FeatureKey, boolean>;
  };
}

interface HealthResult {
  healthy: boolean;
  summary: { pass: number; warn: number; fail: number };
  checks: { name: string; status: string; detail: string; count?: number }[];
}

interface AuditRow {
  id: string;
  actor_user_id: string | null;
  actor_profile_id: string | null;
  target_profile_id: string | null;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
}

interface AccessResult {
  profile: { role: string; is_active: boolean } | null;
  access: {
    role: string;
    plan: string;
    isActive: boolean;
    capabilities: {
      canManageFeatureOverrides: boolean;
      canPromoteOwner: boolean;
    };
  } | null;
}

type HQTab = "users" | "analytics" | "events" | "trials" | "coupons" | "health" | "audit";

type ProfileDraft = {
  role: RoleKey;
  plan: PlanKey;
  is_active: boolean;
  notes: string;
  feature_overrides: Partial<Record<FeatureKey, boolean>>;
};

// Clerk components removed - using Supabase auth only

function HQLogoutButton() {
  const logout = useAdminStore((s) => s.logout);
  const router = useRouter();

  return (
    <button
      onClick={() => {
        logout();
        router.replace("/admin");
      }}
      className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
      aria-label="התנתקות"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}

export default function HQPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const checkSession = useAdminStore((s) => s.checkSession);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<HQTab>("users");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessResult["access"]>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ProfileDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<UserFiltersState>({
    search: "",
    role: "",
    plan: "",
    isActive: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    if (!clerkEnabled) {
      checkSession();
      return;
    }

    // Using Supabase auth only - Clerk removed
    checkSession();
  }, [checkSession, clerkEnabled]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAccess = async () => {
      try {
        const response = await fetch("/api/admin/access");
        const json: AccessResult = await response.json();

        const userRole = json.access?.role ?? json.profile?.role ?? "dj";
        console.log("🔐 HQ Access check - Role:", userRole);
        setRole(userRole);
        setAccess(json.access);

        // Only staff and owner can access HQ
        if (userRole !== "staff" && userRole !== "owner") {
          console.log("❌ Access denied to HQ - redirecting to admin");

          // Try to set bypass cookie for development
          if (process.env.NODE_ENV === "development") {
            console.log("🔧 Development mode: Setting bypass cookie...");
            document.cookie = "compakt-admin-bypass=almog22@gmail.com; path=/; max-age=3600";
            alert("מגדיר גישת פיתוח - נסה לרענן את העמוד");
            window.location.reload();
            return;
          }

          alert("אין לך הרשאות גישה למערכת צוות. מעביר אותך למערכת DJ...");
          router.replace("/admin");
        } else {
          console.log("✅ HQ access granted - Role:", userRole);
        }
      } catch {
        console.log("❌ Failed to check access - redirecting to admin");
        router.replace("/admin");
      }
    };

    checkAccess();
  }, [isAuthenticated, router]);

  const loadProfiles = useCallback(async () => {
    try {
      console.log("🔍 HQ: Loading profiles...");
      const res = await fetch("/api/hq/profiles");
      const data = await res.json();

      if (!res.ok) {
        console.log("❌ HQ: Profiles API error:", data.error);
        throw new Error(data.error || "Failed to load profiles");
      }

      const rows = data.profiles || [];
      console.log("✅ HQ: Profiles loaded:", rows.length);
      setProfiles(rows);

      setDrafts((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          next[row.id] = next[row.id] || {
            role: row.role as RoleKey,
            plan: row.plan as PlanKey,
            is_active: row.is_active,
            notes: row.notes || "",
            feature_overrides: row.feature_overrides || {},
          };
        }
        return next;
      });
    } catch (error) {
      console.error("❌ HQ: Profiles load error:", error);
      // Don't show error to user, just set empty profiles
      setProfiles([]);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/db-health");
      const data = await res.json();
      if (res.ok) setHealth(data);
    } catch {
      // silent
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      console.log("🔍 HQ: Loading audit logs...");
      const res = await fetch("/api/hq/audit");
      const data = await res.json();

      // Always set logs, even if empty
      setAuditLogs(data.logs || []);

      if (!res.ok && data.error) {
        console.log("⚠️ HQ: Audit API returned error:", data.error);
        // Don't show error to user, just log it
      } else {
        console.log("✅ HQ: Audit logs loaded:", data.logs?.length || 0);
      }

      // Show warning if logs are temporarily unavailable
      if (data.message) {
        console.log("⚠️ HQ:", data.message);
      }
    } catch (error) {
      console.error("❌ HQ: Audit load error:", error);
      // Don't show error to user, just set empty logs
      setAuditLogs([]);
    }
  }, []);

  // Development bypass function
  const enableDevBypass = () => {
    if (process.env.NODE_ENV === "development") {
      document.cookie = "compakt-admin-bypass=almog22@gmail.com; path=/; max-age=3600";
      alert("גישת פיתוח הופעלה - מרענן...");
      window.location.reload();
    }
  };

  useEffect(() => {
    if (role === "staff" || role === "owner") {
      Promise.all([loadProfiles(), loadHealth(), loadAudit()]).finally(() => setLoading(false));
    }
  }, [role, loadProfiles, loadHealth, loadAudit]);

  const updateDraft = (profileId: string, patch: Partial<ProfileDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [profileId]: {
        ...(prev[profileId] || {
          role: "dj",
          plan: "starter",
          is_active: true,
          notes: "",
          feature_overrides: {},
        }),
        ...patch,
      },
    }));
  };

  const toggleFeature = (profileId: string, feature: FeatureKey) => {
    const current = drafts[profileId]?.feature_overrides?.[feature] ?? false;
    updateDraft(profileId, {
      feature_overrides: {
        ...(drafts[profileId]?.feature_overrides || {}),
        [feature]: !current,
      },
    });
  };

  const saveProfile = async (profileId: string) => {
    const draft = drafts[profileId];
    if (!draft) return;

    setSavingId(profileId);
    setError(null);
    try {
      const res = await fetch(`/api/hq/profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שמירה נכשלה");
      await Promise.all([loadProfiles(), loadAudit()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שמירה נכשלה");
    } finally {
      setSavingId(null);
    }
  };

  // Filter profiles based on search and filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          p.business_name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.dj_slug?.toLowerCase().includes(search) ||
          p.user_id?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.role && p.role !== filters.role) return false;

      // Plan filter
      if (filters.plan && p.plan !== filters.plan) return false;

      // Active status filter
      if (filters.isActive !== "") {
        const isActive = filters.isActive === "true";
        if (p.is_active !== isActive) return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const createdDate = new Date(p.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (createdDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const createdDate = new Date(p.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (createdDate > toDate) return false;
      }

      return true;
    });
  }, [profiles, filters]);

  // Bulk actions handlers
  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkUpdate = async (updates: BulkUpdateData) => {
    if (selectedIds.size === 0) return;

    setError(null);
    try {
      const res = await fetch("/api/hq/users/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileIds: Array.from(selectedIds),
          updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk update failed");

      await Promise.all([loadProfiles(), loadAudit()]);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed");
      throw e;
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Business Name", "Email", "Slug", "Role", "Plan", "Active", "Created"];
    const rows = filteredProfiles.map((p) => [
      p.business_name || "",
      p.email || "",
      p.dj_slug || "",
      p.role,
      p.plan,
      p.is_active ? "Yes" : "No",
      new Date(p.created_at).toLocaleDateString("he-IL"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compakt-users-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (!isAuthenticated || !role || role === "dj") {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted mb-4">טוען...</div>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={enableDevBypass}
              className="btn-primary text-sm"
            >
              🔧 הפעל גישת פיתוח (פיתוח)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm text-secondary hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Admin
            </a>
            <Shield className="w-5 h-5 text-brand-blue" />
            <h1 className="font-bold text-lg">Compakt HQ</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue font-medium">
              {role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "users"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>משתמשים</span>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "analytics"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>אנליטיקס</span>
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "events"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span>אירועים</span>
              </button>
              <button
                onClick={() => setActiveTab("trials")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "trials"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span>ניסיונות</span>
              </button>
              <button
                onClick={() => setActiveTab("coupons")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "coupons"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <Tag className="w-4 h-4" />
                <span>קופונים</span>
              </button>
              <button
                onClick={() => setActiveTab("health")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "health"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <Activity className="w-4 h-4" />
                <span>בריאות</span>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "audit"
                  ? "bg-brand-blue text-white"
                  : "text-secondary hover:text-foreground"
                  }`}
              >
                <History className="w-4 h-4" />
                <span>Audit</span>
              </button>
            </nav>

            <ThemeToggle />
            <HQLogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="glass-card p-3 text-sm mb-4" style={{ color: "var(--accent-danger)" }}>
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-muted py-20">טוען נתונים...</div>
        ) : activeTab === "users" ? (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">ניהול משתמשים</h2>
              <button
                onClick={handleExportCSV}
                className="btn-primary text-sm px-3 py-1.5 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                ייצוא CSV
              </button>
            </div>

            <UserFilters
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={profiles.length}
              filteredCount={filteredProfiles.length}
            />

            <BulkActions
              selectedIds={selectedIds}
              totalCount={filteredProfiles.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onBulkUpdate={handleBulkUpdate}
              canManageRoles={access?.capabilities.canManageFeatureOverrides ?? false}
            />

            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass text-right">
                    <th className="px-4 py-3 w-12"></th>
                    <th className="px-4 py-3 font-medium text-muted">שם עסק</th>
                    <th className="px-4 py-3 font-medium text-muted">Role</th>
                    <th className="px-4 py-3 font-medium text-muted">Plan</th>
                    <th className="px-4 py-3 font-medium text-muted">סטטוס</th>
                    <th className="px-4 py-3 font-medium text-muted">Email</th>
                    <th className="px-4 py-3 font-medium text-muted">פרטים</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((p) => (
                    <Fragment key={p.id}>
                      <tr key={p.id} className="border-b border-glass/50 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelection(p.id)}
                            className="w-4 h-4 rounded border-glass"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{p.business_name || "—"}</div>
                          <div className="text-[11px] text-muted font-mono">{p.dj_slug || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={drafts[p.id]?.role || (p.role as RoleKey)}
                            onChange={(e) => updateDraft(p.id, { role: e.target.value as RoleKey })}
                            className="px-2 py-1.5 rounded-lg bg-transparent border border-glass text-xs"
                            disabled={p.role === "owner" && !access?.capabilities.canPromoteOwner}
                          >
                            {ROLE_KEYS.map((roleKey) => (
                              <option key={roleKey} value={roleKey}>{roleKey}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={drafts[p.id]?.plan || (p.plan as PlanKey)}
                            onChange={(e) => updateDraft(p.id, { plan: e.target.value as PlanKey })}
                            className="px-2 py-1.5 rounded-lg bg-transparent border border-glass text-xs"
                          >
                            {PLAN_KEYS.map((planKey) => (
                              <option key={planKey} value={planKey}>{planKey}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={drafts[p.id]?.is_active ?? p.is_active}
                              onChange={(e) => updateDraft(p.id, { is_active: e.target.checked })}
                            />
                            {drafts[p.id]?.is_active ?? p.is_active ? "פעיל" : "מושהה"}
                          </label>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{p.email || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => saveProfile(p.id)}
                              disabled={savingId === p.id}
                              className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5"
                            >
                              {savingId === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              שמור
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === p.id && (
                        <tr className="border-b border-glass/50">
                          <td colSpan={6} className="px-4 py-4 bg-white/[0.02]">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted mb-2">Feature overrides</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {FEATURE_KEYS.map((feature) => {
                                    const enabled = drafts[p.id]?.feature_overrides?.[feature] ?? p.feature_overrides?.[feature] ?? false;
                                    return (
                                      <label key={feature} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-glass">
                                        <input
                                          type="checkbox"
                                          checked={enabled}
                                          onChange={() => toggleFeature(p.id, feature)}
                                          disabled={!access?.capabilities.canManageFeatureOverrides}
                                        />
                                        <span>{feature}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs text-muted mb-2">הערות</p>
                                <textarea
                                  value={drafts[p.id]?.notes ?? p.notes ?? ""}
                                  onChange={(e) => updateDraft(p.id, { notes: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm"
                                  rows={3}
                                />
                              </div>

                              <div className="text-[11px] text-muted font-mono flex flex-wrap gap-3">
                                <span>User: {p.user_id ? `${p.user_id.slice(0, 8)}...` : "NULL"}</span>
                                <span>Profile: {p.id.slice(0, 8)}...</span>
                                <span>Created: {new Date(p.created_at).toLocaleString("he-IL")}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        {profiles.length === 0 ? "אין משתמשים רשומים" : "לא נמצאו תוצאות לסינון"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : activeTab === "analytics" ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-bold mb-4">אנליטיקס ודשבורד</h2>
            <DashboardStats />
          </motion.div>
        ) : activeTab === "events" ? (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-bold mb-4">ניהול אירועי זוגות</h2>
            <div className="glass-card p-8 text-center text-muted">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">טאב ניהול אירועים בפיתוח...</p>
              <p className="text-xs mt-2">כאן יוצגו כל האירועים של הזוגות עם אפשרות צפייה, סינון וניהול</p>
            </div>
          </motion.div>
        ) : activeTab === "trials" ? (
          <motion.div
            key="trials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrialManager />
          </motion.div>
        ) : activeTab === "coupons" ? (
          <motion.div
            key="coupons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CouponManager />
          </motion.div>
        ) : activeTab === "health" ? (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">בריאות מערכת</h2>
              <button onClick={loadHealth} className="btn-primary text-sm px-3 py-1.5">
                רענן
              </button>
            </div>
            {health ? (
              <div className="space-y-3">
                <div className="glass-card p-4 flex gap-4 text-center">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-green-400">{health.summary.pass}</div>
                    <div className="text-xs text-muted">Pass</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-yellow-400">{health.summary.warn}</div>
                    <div className="text-xs text-muted">Warn</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-red-400">{health.summary.fail}</div>
                    <div className="text-xs text-muted">Fail</div>
                  </div>
                </div>
                <div className="glass-card divide-y divide-glass">
                  {health.checks.map((c, i) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${c.status === "pass"
                          ? "bg-green-400"
                          : c.status === "warn"
                            ? "bg-yellow-400"
                            : "bg-red-400"
                          }`}
                      />
                      <span className="font-mono text-xs flex-1">{c.name}</span>
                      <span className="text-xs text-muted">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-10">לא נטען</div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Audit Log</h2>
              <button onClick={loadAudit} className="btn-primary text-sm px-3 py-1.5">
                רענן
              </button>
            </div>
            <div className="glass-card divide-y divide-glass">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-xs text-muted">{new Date(log.created_at).toLocaleString("he-IL")}</span>
                  </div>
                  <div className="text-xs text-muted font-mono">target: {log.target_profile_id || "—"}</div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="px-4 py-8 text-center text-muted text-sm">אין audit logs עדיין</div>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
