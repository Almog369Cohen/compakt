"use client";

import { useState } from "react";
import { Users, Music2 } from "lucide-react";
import { GuestInviteManager } from "./GuestInviteManager";
import { MusicAnalysisView } from "./MusicAnalysisView";

type EventGuestManagerProps = {
  eventId: string;
};

export function EventGuestManager({ eventId }: EventGuestManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"guests" | "analysis">("guests");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("guests")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeSubTab === "guests"
              ? "border-purple-600 text-purple-600 font-medium"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4" />
          ניהול אורחים
        </button>
        <button
          onClick={() => setActiveSubTab("analysis")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeSubTab === "analysis"
              ? "border-purple-600 text-purple-600 font-medium"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Music2 className="w-4 h-4" />
          ניתוח מוזיקלי
        </button>
      </div>

      {activeSubTab === "guests" && <GuestInviteManager eventId={eventId} />}
      {activeSubTab === "analysis" && <MusicAnalysisView eventId={eventId} />}
    </div>
  );
}
