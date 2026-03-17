"use client";

import { Music, Instagram, Facebook, Globe } from "lucide-react";

export function ProfileDemo() {
  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-[#059cc0] to-[#03b28c]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Music className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">DJ Almog Cohen</h2>
        <p className="text-white/70 mb-6">
          DJ מקצועי לחתונות ואירועים • מוזיקה שמרגישה נכון
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold">200+</div>
            <div className="text-xs text-white/60">אירועים</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold">5.0</div>
            <div className="text-xs text-white/60">דירוג</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <div className="text-2xl font-bold">12+</div>
            <div className="text-xs text-white/60">שנות ניסיון</div>
          </div>
        </div>

        {/* Social links */}
        <div className="flex gap-3 justify-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Instagram className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Facebook className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* CTA */}
        <button className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] font-semibold text-lg">
          בואו נתחיל
        </button>
      </div>
    </div>
  );
}
