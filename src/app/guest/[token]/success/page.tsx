"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Music2, Sparkles } from "lucide-react";

export default function GuestSuccessPage() {
  const params = useParams();
  const token = params.token as string;

  const [fetching, setFetching] = useState(true);
  const [result, setResult] = useState<{
    playlistsProcessed: number;
    tracksProcessed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch("/api/guest/playlists/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteToken: token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setResult({
            playlistsProcessed: data.playlistsProcessed || 0,
            tracksProcessed: data.tracksProcessed || 0,
          });
        }
      })
      .catch(() => {
        setError("שגיאה בשליפת הפלייליסטים");
      })
      .finally(() => {
        setFetching(false);
      });
  }, [token]);

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">שולפים את הפלייליסטים שלך...</h1>
          <p className="text-gray-600">זה יכול לקחת כמה שניות</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">משהו השתבש</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <Sparkles className="absolute top-4 right-4 w-8 h-8 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 w-6 h-6 animate-pulse" style={{ animationDelay: "1s" }} />
              <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-10" />
            </div>
            <CheckCircle2 className="w-20 h-20 mx-auto mb-4 relative z-10" />
            <h1 className="text-3xl font-bold mb-2 relative z-10">תודה רבה!</h1>
            <p className="text-green-100 relative z-10">הפלייליסטים שלך נשמרו בהצלחה</p>
          </div>

          <div className="p-8">
            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">מה קרה עכשיו?</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {result?.playlistsProcessed || 0}
                  </div>
                  <div className="text-sm text-gray-600">פלייליסטים</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {result?.tracksProcessed || 0}
                  </div>
                  <div className="text-sm text-gray-600">שירים</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p>הדיג׳יי יכול עכשיו לראות את הטעם המוזיקלי שלך</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p>המערכת תמצא את השירים המשותפים עם שאר האורחים</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p>הפלייליסט באירוע יהיה מותאם בדיוק לטעם שלכם</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-sm text-purple-900 font-medium">
                🎉 אתם יכולים לסגור את הדף הזה
              </p>
              <p className="text-xs text-purple-700 mt-1">
                נתראה באירוע!
              </p>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                🎵 עזרו לנו להפוך את המסיבה למושלמת!
              </h3>
              <p className="text-sm text-gray-700 mb-4 text-center">
                שתפו עם חברים שמגיעים לאירוע - ככה נדע בדיוק איזו מוזיקה כולם אוהבים
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const text = encodeURIComponent(
                      `היי! 👋\n\nהמארגן של האירוע רוצה שהמוזיקה תהיה בדיוק בטעם שלנו.\n\nתעזור? זה לוקח פחות מדקה:\n1. לחץ על הלינק\n2. התחבר עם Spotify (חינם)\n3. זהו! 🎵\n\n${window.location.origin}/guest/${token}\n\nתודה! 🙏`
                    );
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  שתף ב-WhatsApp
                </button>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/guest/${token}`;
                    navigator.clipboard.writeText(link);
                    const btn = event?.currentTarget as HTMLButtonElement;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> הועתק!';
                    setTimeout(() => {
                      btn.innerHTML = originalText;
                    }, 2000);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  העתק לינק
                </button>
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
