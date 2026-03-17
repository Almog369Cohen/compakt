"use client";

import { Heart, X, Star, HelpCircle } from "lucide-react";

export function MusicSwipeDemo() {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Album art placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#059cc0] to-[#03b28c] opacity-20" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-8 text-white">
          <div className="mb-8">
            <h3 className="text-3xl font-bold mb-2">Uptown Funk</h3>
            <p className="text-xl text-white/80">Mark Ronson ft. Bruno Mars</p>
            <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm">
              פופ
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button className="w-16 h-16 rounded-full bg-white border-2 border-red-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
          <X className="w-7 h-7 text-red-500" />
        </button>

        <button className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
          <HelpCircle className="w-7 h-7 text-gray-400" />
        </button>

        <button className="w-20 h-20 rounded-full bg-gradient-to-r from-[#059cc0] to-[#03b28c] flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
          <Heart className="w-9 h-9 text-white" />
        </button>

        <button className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
          <Star className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Counter */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">5 מתוך 20 שירים</p>
      </div>
    </div>
  );
}
