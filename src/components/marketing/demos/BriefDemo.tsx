"use client";

import { Check, Heart, Star, Music } from "lucide-react";

export function BriefDemo() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#059cc0] to-[#03b28c] p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">בריף מוזיקלי - חתונת דני ושירה</h3>
        <p className="text-white/80">15 במאי 2026 • 200 אורחים • DJ Almog Cohen</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Must play songs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">שירי חובה (8)</h4>
          </div>
          <div className="space-y-2">
            {["Perfect - Ed Sheeran", "Thinking Out Loud - Ed Sheeran", "שיר אהבה - עברי לידר"].map((song, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <Music className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-700">{song}</span>
              </div>
            ))}
            <div className="text-sm text-gray-400 text-center py-2">+ 5 שירים נוספים</div>
          </div>
        </div>

        {/* Liked songs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">שירים שאהבו (24)</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["Uptown Funk", "Can't Stop the Feeling", "Happy", "Shake It Off"].map((song, i) => (
              <div key={i} className="p-2 rounded-lg bg-green-50 border border-green-100 text-sm text-gray-700 text-center">
                {song}
              </div>
            ))}
            <div className="col-span-2 text-sm text-gray-400 text-center py-2">+ 20 שירים נוספים</div>
          </div>
        </div>

        {/* Event details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">פרטי האירוע</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-gray-600">סגנון מוזיקה</span>
              <span className="font-medium text-gray-900">פופ, רוק, ישראלי</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-gray-600">אנרגיה</span>
              <span className="font-medium text-gray-900">גבוהה</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-gray-50">
              <span className="text-gray-600">בקשות מיוחדות</span>
              <span className="font-medium text-gray-900">שיר פתיחה רומנטי</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
