"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Send,
  AlertCircle,
} from "lucide-react";

type Guest = {
  id: string;
  guestEmail: string;
  guestName: string | null;
  inviteToken: string;
  status: string;
  sentAt: string;
  connectedAt: string | null;
  totalPlaylists: number;
  totalTracks: number;
};

type GuestManagerProps = {
  eventToken: string;
};

export function GuestManager({ eventToken }: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestInput, setGuestInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, connected: 0, pending: 0 });

  useEffect(() => {
    if (!eventToken) {
      console.log("❌ No eventToken provided to GuestManager");
      setLoading(false);
      return;
    }
    loadGuests();
  }, [eventToken]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      console.log("🔍 Loading guests for token:", eventToken);
      const res = await fetch(`/api/couple/event/${eventToken}/guests`);
      const data = await res.json();
      console.log("📊 Guests API response:", data);
      if (data.guests) {
        setGuests(data.guests);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuests = async () => {
    if (!guestInput.trim()) return;

    setAdding(true);
    try {
      const lines = guestInput.split("\n").filter((line) => line.trim());
      console.log("🔍 Adding guests with token:", eventToken);
      console.log("👥 Guests to add:", lines);

      const res = await fetch("/api/couple/guests/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventToken,
          guests: lines,
        }),
      });

      const data = await res.json();
      console.log("📊 Add guests API response:", data);
      if (data.success) {
        setShowAddModal(false);
        setGuestInput("");
        loadGuests();
      } else {
        alert(data.error || "שגיאה בהוספת אורחים");
      }
    } catch (error) {
      console.error("Failed to add guests:", error);
      alert("שגיאה בהוספת אורחים");
    } finally {
      setAdding(false);
    }
  };

  const getMessageTemplate = (token: string, name?: string | null) => {
    const link = `${window.location.origin}/guest/${token}`;
    const greeting = name ? `היי ${name}` : "היי";
    return `${greeting}! 🎵

אנחנו רוצים שהמוזיקה באירוע שלנו תהיה מושלמת בשבילכם!

לחצו על הלינק הזה כדי לשתף את הטעם המוזיקלי שלכם (לוקח פחות מדקה):
${link}

תודה רבה! 💜`;
  };

  const copyMessage = (token: string, name?: string | null, guestId?: string) => {
    const message = getMessageTemplate(token, name);
    navigator.clipboard.writeText(message);
    if (guestId) {
      setCopiedId(guestId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const copyAllMessages = () => {
    const messages = guests
      .slice(0, 10)
      .map((g) => getMessageTemplate(g.inviteToken, g.guestName))
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(messages);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const progressPercentage = stats.total > 0 ? (stats.connected / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!eventToken) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-red-200">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-900 mb-2">שגיאה בטעינת האירוע</h3>
        <p className="text-red-700 mb-4">
          לא נמצא אירוע פעיל. אנא צור אירוע חדש או טען אירוע קיים.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          רענן דף
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎵 האורחים שלנו</h2>
          <p className="text-sm text-gray-600 mt-1">
            הוסיפו אורחים ושלחו להם לינק לשיתוף הטעם המוזיקלי שלהם
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          הוסף אורחים
        </button>
      </div>

      {stats.total > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">התקדמות</h3>
            <span className="text-3xl font-bold text-purple-600">
              {stats.connected}/{stats.total}
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
            {stats.connected === stats.total
              ? "🎉 כל האורחים התחברו!"
              : `עוד ${stats.total - stats.connected} אורחים לא התחברו`}
          </p>
        </div>
      )}

      {guests.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={copyAllMessages}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {copiedId === "all" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                הועתק!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                העתק הודעות ל-{Math.min(10, guests.length)} ראשונים
              </>
            )}
          </button>
        </div>
      )}

      {guests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">עדיין אין אורחים</h3>
          <p className="text-gray-600 mb-4">
            לחצו על &quot;הוסף אורחים&quot; כדי להתחיל
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שם</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אימייל</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {guest.guestName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{guest.guestEmail}</td>
                    <td className="px-4 py-3">
                      {guest.status === "connected" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            התחבר
                          </span>
                          {guest.totalPlaylists > 0 && (
                            <span className="text-xs text-gray-500">
                              {guest.totalPlaylists} פלייליסטים
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          <Clock className="w-3 h-3" />
                          ממתין
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyMessage(guest.inviteToken, guest.guestName, guest.id)}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {copiedId === guest.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            הועתק!
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            שלח הודעה
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">הוסף אורחים</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                הדביקו רשימת אימיילים, אחד בכל שורה. אפשר להוסיף שם אחרי פסיק:
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 font-mono">
                friend1@gmail.com, דני<br />
                friend2@gmail.com, מיכל<br />
                friend3@gmail.com
              </div>

              <textarea
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="friend1@gmail.com, שם&#10;friend2@gmail.com&#10;friend3@gmail.com"
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                dir="ltr"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddGuests}
                  disabled={adding || !guestInput.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מוסיף...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      הוסף אורחים
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ביטול
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
