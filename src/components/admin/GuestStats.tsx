"use client";

import { useState, useEffect } from "react";
import { Users, Music2, ListMusic, Loader2, Calendar, RefreshCw, ExternalLink } from "lucide-react";

type GuestStats = {
  totalGuests: number;
  connectedGuests: number;
  totalPlaylists: number;
  totalTracks: number;
  recentGuests: Array<{
    id: string;
    guestEmail: string;
    guestName: string | null;
    connectedAt: string;
    eventName: string;
    eventDate: string | null;
  }>;
};

export function GuestStats() {
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      console.log("📊 Fetching stats from API...");
      const res = await fetch("/api/admin/stats/guests");
      console.log("📊 API response status:", res.status);
      const data = await res.json();
      console.log("📊 API response data:", data);
      if (data.stats) {
        setStats(data.stats);
        console.log("✅ Stats updated:", data.stats);
      }
    } catch (error) {
      console.error("❌ Failed to load guest stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    alert("🔄 Sync button clicked! Check console for details.");
    console.log("🔄 Sync button clicked");
    console.log("🍪 Checking cookies:", document.cookie);
    setSyncing(true);
    try {
      console.log("🔄 Loading stats...");
      await loadStats();
      console.log("✅ Stats loaded successfully");
    } catch (error) {
      console.error("❌ Failed to sync stats:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSpotifyPlaylist = async () => {
    try {
      // Get the most recent event with guests
      const res = await fetch("/api/admin/stats/guests");
      const data = await res.json();

      if (data.stats?.recentGuests?.length > 0) {
        const firstGuest = data.stats.recentGuests[0];
        const eventId = firstGuest.eventId;

        if (eventId) {
          // Create Spotify playlist
          const playlistRes = await fetch(`/api/admin/event/${eventId}/export-playlist`, {
            method: "POST",
          });

          if (playlistRes.ok) {
            const playlistData = await playlistRes.json();
            if (playlistData.spotifyUrl) {
              window.open(playlistData.spotifyUrl, '_blank');
            }
          } else {
            const errorData = await playlistRes.json();
            if (errorData.needsSpotifyAuth) {
              alert("דייג'י לא מחובר ל-Spotify. אנא התחבר תחילה.");
            } else {
              alert("לא ניתן ליצור פלייליסט ב-Spotify. אנא בדוק שהרשאות מוגדרות כראוי.");
            }
          }
        } else {
          alert("לא נמצא אירוע עם אורחים מחוברים");
        }
      } else {
        alert("אין אורחים מחוברים ליצירת פלייליסט");
      }
    } catch (error) {
      console.error("Failed to create Spotify playlist:", error);
      alert("שגיאה ביצירת פלייליסט ב-Spotify");
    }
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
        <p className="text-gray-600">לא ניתן לטעון סטטיסטיקות</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">סטטיסטיקות אורחים</h2>
          <p className="text-sm text-gray-600 mt-1">
            סה&quot;כ אורחים שהתחברו עם Spotify
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSpotifyPlaylist}
            disabled={stats.connectedGuests === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            צור פלייליסט Spotify
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'מסנכרן...' : 'סנכרן פרופיל Spotify'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalGuests}</div>
              <div className="text-sm text-gray-600">סה&quot;כ אורחים</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.connectedGuests}</div>
              <div className="text-sm text-gray-600">התחברו</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ListMusic className="w-5 h-5 text-blue-600" />
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
              <Music2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalTracks.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">שירים נאספו</div>
            </div>
          </div>
        </div>
      </div>

      {stats.connectedGuests > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">אורחים אחרונים שהתחברו</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שם</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אימייל</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אירוע</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">תאריך התחברות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {guest.guestName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{guest.guestEmail}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div>{guest.eventName}</div>
                          {guest.eventDate && (
                            <div className="text-xs text-gray-500">{guest.eventDate}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(guest.connectedAt).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.connectedGuests === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">עדיין אין אורחים שהתחברו</p>
          <p className="text-sm text-gray-500 mt-1">
            הוסף אורחים לאירועים שלך והם יופיעו כאן
          </p>
        </div>
      )}
    </div>
  );
}
