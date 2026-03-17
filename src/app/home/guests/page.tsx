"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventStore } from "@/stores/eventStore";
import { GuestManager } from "@/components/couple/GuestManager";
import { Loader2 } from "lucide-react";

export default function CoupleGuestsPage() {
  const router = useRouter();
  const event = useEventStore((s) => s.event);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event?.magicToken) {
      router.push("/home");
    } else {
      setLoading(false);
    }
  }, [event, router]);

  if (loading || !event?.magicToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <GuestManager eventToken={event.magicToken} />
      </div>
    </div>
  );
}
