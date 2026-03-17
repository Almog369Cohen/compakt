"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Music2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";

type PilotStats = {
  eventId: string;
  eventName: string;
  totalInvited: number;
  totalConnected: number;
  totalPlaylists: number;
  totalTracks: number;
  conversionRate: number;
  topTracks: Array<{
    title: string;
    artist: string;
    occurrenceCount: number;
    guestPercentage: number;
  }>;
  guests: Array<{
    id: string;
    guestEmail: string;
    guestName: string | null;
    status: string;
    connectedAt: string | null;
    totalPlaylists: number;
    totalTracks: number;
  }>;
};

type PilotDashboardProps = {
  eventId: string;
};

export function PilotDashboard({ eventId }: PilotDashboardProps) {
  const [stats, setStats] = useState<PilotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadStats = async () => {
    if (!loading) setRefreshing(true);
    try {
      const [guestsRes, analysisRes] = await Promise.all([
        fetch(`/api/admin/event/${eventId}/guests`),
        fetch(`/api/admin/event/${eventId}/music-analysis`),
      ]);

      const guestsData = await guestsRes.json();
      const analysisData = await analysisRes.json();

      if (guestsData.guests) {
        const guests = guestsData.guests as Array<{ status: string; totalPlaylists: number; totalTracks: number }>;
        const connected = guests.filter((g) => g.status === "connected");
        const totalPlaylists = guests.reduce((sum: number, g) => sum + g.totalPlaylists, 0);
        const totalTracks = guests.reduce((sum: number, g) => sum + g.totalTracks, 0);

        setStats({
          eventId,
          eventName: "פיילוט Spotify",
          totalInvited: guests.length,
          totalConnected: connected.length,
          totalPlaylists,
          totalTracks,
          conversionRate: guests.length > 0 ? Math.round((connected.length / guests.length) * 100) : 0,
          topTracks: analysisData.analysis?.topTracks?.slice(0, 10) || [],
          guests,
        });
      }
    } catch (error) {
      console.error("Failed to load pilot stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const csvContent = [
      ["שם", "אימייל", "סטטוס", "פלייליסטים", "שירים", "תאריך התחברות"],
      ...stats.guests.map((g) => [
        g.guestName || "-",
        g.guestEmail,
        g.status === "connected" ? "מחובר" : "ממתין",
        g.totalPlaylists.toString(),
        g.totalTracks.toString(),
        g.connectedAt ? new Date(g.connectedAt).toLocaleString("he-IL") : "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pilot-results-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">לא ניתן לטעון נתוני פיילוט</p>
      </div>
    );
  }

  const progressPercentage = (stats.totalConnected / stats.totalInvited) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎯 דשבורד פיילוט</h2>
          <p className="text-sm text-gray-600 mt-1">
            מעקב בזמן אמת אחרי התקדמות הפיילוט
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "מרענן..." : "רענן"}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            ייצא לאקסל
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">התקדמות כללית</h3>
          <span className="text-3xl font-bold text-purple-600">
            {stats.totalConnected}/{stats.totalInvited}
          </span>
        </div>
        <div className="relative h-8 bg-white rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500"
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700">
            {Math.round(progressPercentage)}%
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          {stats.totalConnected === stats.totalInvited
            ? "🎉 כל האורחים התחברו!"
            : `עוד ${stats.totalInvited - stats.totalConnected} אורחים לא התחברו`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalInvited}</div>
              <div className="text-sm text-gray-600">הוזמנו</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalConnected}</div>
              <div className="text-sm text-gray-600">התחברו</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Music2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPlaylists}</div>
              <div className="text-sm text-gray-600">פלייליסטים</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion</div>
            </div>
          </div>
        </div>
      </div>

      {stats.topTracks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">🎵 Top 10 שירים עד כה</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {stats.topTracks.map((track, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{track.title}</div>
                    <div className="text-sm text-gray-600 truncate">{track.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{track.occurrenceCount}</div>
                    <div className="text-xs text-gray-500">{track.guestPercentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">רשימת משתתפים</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שם</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אימייל</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">סטטוס</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">פלייליסטים</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שירים</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">זמן</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.guestName || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{guest.guestEmail}</td>
                  <td className="px-4 py-3">
                    {guest.status === "connected" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        מחובר
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        ממתין
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.totalPlaylists > 0 ? guest.totalPlaylists : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {guest.totalTracks > 0 ? guest.totalTracks : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {guest.connectedAt
                      ? new Date(guest.connectedAt).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 טיפים לפיילוט מוצלח</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• שלח תזכורת לאורחים שלא התחברו אחרי 2-3 שעות</li>
          <li>• בדוק שהלינקים עובדים במובייל</li>
          <li>• אסוף פידבק מהמשתתפים אחרי שהם מסיימים</li>
          <li>• רענן את הניתוח אחרי כל 3-4 משתתפים חדשים</li>
        </ul>
      </div>
    </div>
  );
}
