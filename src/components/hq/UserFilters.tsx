"use client";

import { Search, X, Filter } from "lucide-react";
import { ROLE_KEYS, PLAN_KEYS } from "@/lib/access";

export interface UserFiltersState {
  search: string;
  role: string;
  plan: string;
  isActive: string;
  dateFrom: string;
  dateTo: string;
}

interface UserFiltersProps {
  filters: UserFiltersState;
  onFiltersChange: (filters: UserFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

export function UserFilters({ filters, onFiltersChange, totalCount, filteredCount }: UserFiltersProps) {
  const updateFilter = (key: keyof UserFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      role: "",
      plan: "",
      isActive: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="glass-card p-4 mb-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="חיפוש לפי שם עסק, email, slug..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter("search", "")}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="w-4 h-4" />
          <span>סינון:</span>
        </div>

        {/* Role Filter */}
        <select
          value={filters.role}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:border-brand-blue transition-colors"
        >
          <option value="">כל התפקידים</option>
          {ROLE_KEYS.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {/* Plan Filter */}
        <select
          value={filters.plan}
          onChange={(e) => updateFilter("plan", e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:border-brand-blue transition-colors"
        >
          <option value="">כל התוכניות</option>
          {PLAN_KEYS.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>

        {/* Active Status Filter */}
        <select
          value={filters.isActive}
          onChange={(e) => updateFilter("isActive", e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:border-brand-blue transition-colors"
        >
          <option value="">כל הסטטוסים</option>
          <option value="true">פעילים</option>
          <option value="false">מושהים</option>
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:border-brand-blue transition-colors"
          />
          <span className="text-xs text-muted">עד</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:border-brand-blue transition-colors"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-glass text-xs hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            נקה סינונים
          </button>
        )}

        {/* Results Count */}
        <div className="mr-auto text-xs text-muted">
          {filteredCount === totalCount ? (
            <span>סה״כ {totalCount} משתמשים</span>
          ) : (
            <span>
              מציג {filteredCount} מתוך {totalCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted">מסננים מהירים:</span>
        <button
          onClick={() => onFiltersChange({ ...filters, isActive: "true", role: "", plan: "" })}
          className="px-2.5 py-1 rounded-lg bg-brand-green/10 text-brand-green text-xs hover:bg-brand-green/20 transition-colors"
        >
          פעילים
        </button>
        <button
          onClick={() => onFiltersChange({ ...filters, plan: "premium", role: "", isActive: "" })}
          className="px-2.5 py-1 rounded-lg bg-brand-blue/10 text-brand-blue text-xs hover:bg-brand-blue/20 transition-colors"
        >
          Premium
        </button>
        <button
          onClick={() => onFiltersChange({ ...filters, role: "staff", plan: "", isActive: "" })}
          className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 transition-colors"
        >
          Staff
        </button>
        <button
          onClick={() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            onFiltersChange({
              ...filters,
              dateFrom: sevenDaysAgo.toISOString().split("T")[0],
              dateTo: new Date().toISOString().split("T")[0],
            });
          }}
          className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-colors"
        >
          חדשים (7 ימים)
        </button>
      </div>
    </div>
  );
}
