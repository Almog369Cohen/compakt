"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Music2,
  Mail,
  Loader2,
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

type GuestInviteManagerProps = {
  eventId: string;
};

export function GuestInviteManager({ eventId }: GuestInviteManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuests, setNewGuests] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showMessageTemplate, setShowMessageTemplate] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);

  useEffect(() => {
    loadGuests();
  }, [eventId]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/event/${eventId}/guests`);
      const data = await res.json();
      if (data.guests) {
        setGuests(data.guests);
      }
    } catch (error) {
      console.error("Failed to load guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuests = async () => {
    const lines = newGuests.split("\n").filter((line) => line.trim());
    const guestList = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        email: parts[0],
        name: parts[1] || undefined,
      };
    });

    if (guestList.length === 0) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/admin/event/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: guestList }),
      });

      if (res.ok) {
        setNewGuests("");
        setShowAddModal(false);
        await loadGuests();
      }
    } catch (error) {
      console.error("Failed to add guests:", error);
    } finally {
      setAdding(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/guest/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const copyAllLinks = () => {
    const links = guests
      .map((g) => `${g.guestName || g.guestEmail}: ${window.location.origin}/guest/${g.inviteToken}`)
      .join('\n\n');
    navigator.clipboard.writeText(links);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2000);
  };

  const getMessageTemplate = (token: string, guestName?: string) => {
    return `היי${guestName ? ` ${guestName}` : ''}! 👋

אני מארגן אירוע ורוצה שהמוזיקה תהיה בדיוק בטעם של כולם.

תעזור לי? זה לוקח פחות מדקה:
1. לחץ על הלינק
2. התחבר עם Spotify (חינם)
3. זהו! 🎵

הלינק שלך: ${window.location.origin}/guest/${token}

תודה! 🙏`;
  };

  const connectedCount = guests.filter((g) => g.status === "connected").length;
  const totalCount = guests.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">אורחים</h2>
          <p className="text-sm text-gray-600 mt-1">
            שתפו לינקים עם אורחים כדי לאסוף את הטעם המוזיקלי שלהם
          </p>
        </div>
        <div className="flex gap-2">
          {guests.length > 0 && (
            <>
              <button
                onClick={() => setShowMessageTemplate(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                תבנית הודעה
              </button>
              <button
                onClick={copyAllLinks}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {bulkCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    הועתק!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    העתק הכל
                  </>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף אורחים
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-sm text-gray-600">סה&quot;כ אורחים</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{connectedCount}</div>
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
              <div className="text-2xl font-bold text-gray-900">
                {guests.reduce((sum, g) => sum + g.totalTracks, 0)}
              </div>
              <div className="text-sm text-gray-600">שירים נאספו</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">עדיין לא הוספת אורחים</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              הוסף אורחים עכשיו
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שם</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">אימייל</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">סטטוס</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">פלייליסטים</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">שירים</th>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyInviteLink(guest.inviteToken)}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          {copiedToken === guest.inviteToken ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              הועתק!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              לינק
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(getMessageTemplate(guest.inviteToken, guest.guestName || undefined));
                            setCopiedToken(`msg_${guest.inviteToken}`);
                            setTimeout(() => setCopiedToken(null), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {copiedToken === `msg_${guest.inviteToken}` ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              הועתק!
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              הודעה
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMessageTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowMessageTemplate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">תבניות הודעות מוכנות</h3>

              <div className="space-y-4">
                {guests.slice(0, 3).map((guest) => (
                  <div key={guest.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {guest.guestName || guest.guestEmail}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getMessageTemplate(guest.inviteToken, guest.guestName || undefined));
                          setCopiedToken(guest.inviteToken);
                          setTimeout(() => setCopiedToken(null), 2000);
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                      >
                        {copiedToken === guest.inviteToken ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            הועתק!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            העתק
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                      {getMessageTemplate(guest.inviteToken, guest.guestName || undefined)}
                    </pre>
                  </div>
                ))}

                {guests.length > 3 && (
                  <p className="text-sm text-gray-600 text-center">
                    מציג 3 ראשונים. לחץ &quot;העתק&quot; ליד כל אורח בטבלה למטה לקבלת הודעה אישית.
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowMessageTemplate(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">הוסף אורחים</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  רשימת אורחים
                </label>
                <textarea
                  value={newGuests}
                  onChange={(e) => setNewGuests(e.target.value)}
                  placeholder="email@example.com, שם האורח&#10;another@example.com&#10;third@example.com, שם שלישי"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  כל שורה: אימייל, שם (אופציונלי)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddGuests}
                  disabled={adding || !newGuests.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מוסיף...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      הוסף
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
