"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, DollarSign, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    activePercentage: number;
    premiumUsers: number;
    starterUsers: number;
    staffUsers: number;
    inactiveUsers: number;
  };
  growth: {
    newUsersLast7Days: number;
    newUsersLast30Days: number;
  };
  conversion: {
    rate: number;
    starterToPremium: number;
    potentialUpgrades: number;
  };
  revenue: {
    monthly: number;
    yearly: number;
    perUser: number;
  };
  distribution: {
    plans: Record<string, number>;
    roles: Record<string, number>;
  };
}

export function DashboardStats() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/hq/analytics/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats");
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <p className="mt-2 text-sm text-muted">טוען סטטיסטיקות...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card p-4 text-sm text-red-400">
        {error || "Failed to load stats"}
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "סך משתמשים",
      value: stats.overview.totalUsers,
      subValue: `${stats.overview.activeUsers} פעילים (${stats.overview.activePercentage.toFixed(0)}%)`,
      color: "text-brand-blue",
      bgColor: "bg-brand-blue/10",
    },
    {
      icon: TrendingUp,
      label: "משתמשים חדשים",
      value: stats.growth.newUsersLast7Days,
      subValue: `${stats.growth.newUsersLast30Days} ב-30 ימים`,
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
    },
    {
      icon: DollarSign,
      label: "הכנסה חודשית",
      value: `₪${stats.revenue.monthly.toLocaleString()}`,
      subValue: `${stats.overview.premiumUsers} Premium × ₪${stats.revenue.perUser}`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      icon: Activity,
      label: "Conversion Rate",
      value: `${stats.conversion.rate.toFixed(1)}%`,
      subValue: `${stats.conversion.potentialUpgrades} פוטנציאל`,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-4 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted">{card.subValue}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <h3 className="text-sm font-medium mb-3">התפלגות תוכניות</h3>
          <div className="space-y-2">
            {Object.entries(stats.distribution.plans).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm capitalize">{plan}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue rounded-full"
                      style={{
                        width: `${(count / stats.overview.totalUsers) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4"
        >
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-blue" />
            Insights
          </h3>
          <div className="space-y-3">
            {stats.overview.inactiveUsers > 0 && (
              <div className="text-xs p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                🚨 {stats.overview.inactiveUsers} משתמשים לא פעילים
              </div>
            )}
            {stats.conversion.potentialUpgrades > 5 && (
              <div className="text-xs p-2 rounded-lg bg-brand-green/10 text-brand-green">
                💡 {stats.conversion.potentialUpgrades} משתמשים Starter - פוטנציאל לשדרוג
              </div>
            )}
            {stats.growth.newUsersLast7Days > 0 && (
              <div className="text-xs p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
                📈 {stats.growth.newUsersLast7Days} הרשמות חדשות השבוע
              </div>
            )}
            {stats.revenue.yearly > 0 && (
              <div className="text-xs p-2 rounded-lg bg-purple-500/10 text-purple-400">
                💰 הכנסה שנתית צפויה: ₪{stats.revenue.yearly.toLocaleString()}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
