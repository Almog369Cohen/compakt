"use client";

import { Calendar, Users, Music, TrendingUp } from "lucide-react";

export function DashboardDemo() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
        <h3 className="text-2xl font-bold mb-1">Dashboard</h3>
        <p className="text-white/70">ברוך הבא, DJ Almog Cohen</p>
      </div>

      {/* Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-sm text-gray-600">אירועים פעילים</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-600">השלימו שאלון</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">247</div>
            <div className="text-sm text-gray-600">שירים נבחרו</div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">94%</div>
            <div className="text-sm text-gray-600">שביעות רצון</div>
          </div>
        </div>

        {/* Recent events */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-4">אירועים קרובים</h4>
          <div className="space-y-3">
            {[
              { couple: "דני ושירה", date: "15 במאי", status: "הושלם", color: "green" },
              { couple: "יוסי ומיכל", date: "22 במאי", status: "בתהליך", color: "yellow" },
              { couple: "אורי ותמר", date: "5 ביוני", status: "ממתין", color: "gray" },
            ].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#059cc0] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center text-white font-bold">
                    {event.couple.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{event.couple}</div>
                    <div className="text-sm text-gray-500">{event.date}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${event.color === "green" ? "bg-green-100 text-green-700" :
                    event.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                  }`}>
                  {event.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
