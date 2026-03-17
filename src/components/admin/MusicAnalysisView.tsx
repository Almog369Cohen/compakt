"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Music2,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  BarChart3,
  ExternalLink,
} from "lucide-react";

type TrackAnalysis = {
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  occurrenceCount: number;
  guestPercentage: number;
  popularity: number;
};

type AnalysisData = {
  topTracks: TrackAnalysis[];
  totalGuestsConnected: number;
  totalTracksAnalyzed: number;
  lastAnalyzedAt: string;
};

type MusicAnalysisViewProps = {
  eventId: string;
};

export function MusicAnalysisView({ eventId }: MusicAnalysisViewProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [eventId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/event/${eventId}/music-analysis`);
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setCached(data.cached || false);
      }
    } catch (error) {
      console.error("Failed to load analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/event/${eventId}/music-analysis`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setCached(false);
      }
    } catch (error) {
      console.error("Failed to refresh analysis:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!analysis || analysis.totalGuestsConnected === 0) {
    return (
      <div className="text-center py-12">
        <Music2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">אין נתונים לניתוח</h3>
        <p className="text-gray-600">
          {analysis?.totalGuestsConnected === 0
            ? "עדיין אין אורחים שהתחברו עם Spotify"
            : "טען את הנתונים כדי לראות ניתוח"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניתוח מוזיקלי</h2>
          <p className="text-sm text-gray-600 mt-1">
            השירים הפופולריים ביותר בקרב האורחים
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "מרענן..." : "רענן ניתוח"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analysis.totalGuestsConnected}
              </div>
              <div className="text-sm text-gray-600">אורחים מחוברים</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Music2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analysis.totalTracksAnalyzed.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">שירים נותחו</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {analysis.topTracks.length}
              </div>
              <div className="text-sm text-gray-600">שירים מובילים</div>
            </div>
          </div>
        </div>
      </div>

      {cached && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>
              הניתוח האחרון בוצע ב-
              {new Date(analysis.lastAnalyzedAt).toLocaleString("he-IL")}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Top 50 שירים</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 w-12">#</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שיר</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אמן</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">חזרות</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">% אורחים</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">פופולריות</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysis.topTracks.map((track, index) => (
                <motion.tr
                  key={track.spotifyTrackId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{track.title}</div>
                    {track.album && (
                      <div className="text-xs text-gray-500">{track.album}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{track.artist}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      {track.occurrenceCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {track.guestPercentage}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[60px]">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${track.popularity}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{track.popularity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">💡 טיפ</h4>
        <p className="text-sm text-purple-800">
          השירים ברשימה ממוינים לפי מספר החזרות בפלייליסטים של האורחים. שירים עם אחוז גבוה
          מופיעים בפלייליסטים של רוב האורחים ויכולים להיות בחירה מצוינת לאירוע.
        </p>
      </div>
    </div>
  );
}
