"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Music, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type InvitationData = {
  id: string;
  guestEmail: string;
  guestName: string | null;
  status: string;
  event: {
    id: string;
    couple_name_a: string;
    couple_name_b: string;
    event_date: string;
    venue: string;
    event_type: string;
  };
};

export default function GuestInvitePage() {
  const params = useParams();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'playlists' | 'top-tracks' | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/guest/invite/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvitation(data.invitation);
        }
      })
      .catch(() => {
        setError("שגיאה בטעינת ההזמנה");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleConnect = (option: 'playlists' | 'top-tracks') => {
    sessionStorage.setItem(`guest_choice_${token}`, option);
    window.location.href = `/api/guest/spotify/connect?token=${token}&choice=${option}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה לא תקינה</h1>
          <p className="text-gray-600">{error || "ההזמנה לא נמצאה"}</p>
        </div>
      </div>
    );
  }

  const { event } = invitation;
  const coupleNames = [event.couple_name_a, event.couple_name_b].filter(Boolean).join(" ו");

  if (invitation.status === "connected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">תודה רבה!</h1>
          <p className="text-gray-600 mb-4">
            הפלייליסטים שלך נשמרו בהצלחה
          </p>
          <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-1">האירוע:</p>
            <p>{coupleNames}</p>
            {event.event_date && <p className="text-gray-500 mt-1">{event.event_date}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
            <Music className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">שתפו את הטעם המוזיקלי שלכם</h1>
            <p className="text-purple-100">
              {coupleNames} מזמינים אתכם לשתף את הפלייליסטים שלכם
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">פרטי האירוע</h2>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">זוג:</span> {coupleNames}</p>
                  {event.event_date && (
                    <p><span className="font-medium">תאריך:</span> {event.event_date}</p>
                  )}
                  {event.venue && (
                    <p><span className="font-medium">מקום:</span> {event.venue}</p>
                  )}
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">למה זה חשוב?</h3>
                <ul className="space-y-2">
                  <li>הדיג׳יי רוצה להכיר את הטעם המוזיקלי של האורחים</li>
                  <li>נמצא את השירים המשותפים שכולם אוהבים</li>
                  <li>ניצור פלייליסט מושלם שמתאים לכל האורחים</li>
                  <li>זה לוקח רק דקה אחת!</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">🔒 פרטיות מובטחת</h3>
                <p className="text-sm text-purple-700">
                  אנחנו רק קוראים את רשימת הפלייליסטים שלכם. לא נשנה, לא נמחק, ולא נשתף עם אף אחד.
                </p>
              </div>
            </div>

            {!selectedOption ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                  איך תרצו לשתף את הטעם המוזיקלי שלכם?
                </h3>

                <button
                  onClick={() => setSelectedOption('playlists')}
                  className="w-full bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 p-6 rounded-xl transition-all text-right group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <Music className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">🎵 הפלייליסטים שלי</h4>
                      <p className="text-sm text-gray-600">
                        בחרו פלייליסטים ספציפיים שאתם רוצים לשתף
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedOption('top-tracks')}
                  className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 p-6 rounded-xl transition-all text-right group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">⭐ Top 50 שלי</h4>
                      <p className="text-sm text-gray-600">
                        50 השירים שאתם הכי אוהבים (אוטומטי)
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-700 text-center">
                    {selectedOption === 'playlists'
                      ? '🎵 תבחרו את הפלייליסטים שלכם אחרי ההתחברות'
                      : '⭐ נשלוף אוטומטית את 50 השירים המושמעים ביותר שלכם'
                    }
                  </p>
                </div>

                <button
                  onClick={() => handleConnect(selectedOption)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  התחבר עם Spotify
                </button>

                <button
                  onClick={() => setSelectedOption(null)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  ← חזרה לבחירה
                </button>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-4">
              לוקח פחות מדקה • לא צריך Spotify Premium
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">שאלות נפוצות</h3>
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">האם צריך Spotify Premium?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-2 px-3 text-sm text-gray-600">
                    לא! Spotify Free מספיק לחלוטין. אנחנו רק קוראים את רשימת הפלייליסטים שלך.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">האם זה בטוח?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-2 px-3 text-sm text-gray-600">
                    כן! אנחנו רק קוראים את רשימת הפלייליסטים. לא נשנה, לא נמחק, ולא נשתף את הנתונים שלך עם אף אחד.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">כמה זמן זה לוקח?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-2 px-3 text-sm text-gray-600">
                    פחות מדקה! לחיצה על הכפתור, התחברות ל-Spotify, וזהו - הכל קורה אוטומטית.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">מה קורה עם הפלייליסטים שלי?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-2 px-3 text-sm text-gray-600">
                    הדייג&apos;י רואה את השירים שיש בפלייליסטים שלך ומשווה אותם עם שאר האורחים. ככה הוא יודע איזו מוזיקה כולם אוהבים!
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>מופעל על ידי Compakt</p>
        </div>
      </div>
    </div>
  );
}
