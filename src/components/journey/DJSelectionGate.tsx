"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, ChevronLeft, Search, Music2, Sparkles, ArrowRight } from "lucide-react";

type PublicDj = {
  id: string;
  business_name: string;
  dj_slug: string;
  logo_url?: string;
  cover_url?: string;
  tagline?: string;
  bio?: string;
};

type DJSelectionGateProps = {
  onSelect: (dj: PublicDj) => void;
};

export function DJSelectionGate({ onSelect }: DJSelectionGateProps) {
  const router = useRouter();
  const [djs, setDjs] = useState<PublicDj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDjs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/public/djs", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "לא הצלחנו לטעון את רשימת הדיג׳יים");
        }

        if (!cancelled) {
          setDjs(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setDjs([]);
          setError(err instanceof Error ? err.message : "לא הצלחנו לטעון את רשימת הדיג׳יים");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDjs();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDjs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return djs;
    return djs.filter((dj) =>
      dj.business_name.toLowerCase().includes(normalized) || dj.dj_slug.toLowerCase().includes(normalized)
    );
  }, [djs, query]);

  const getInitials = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl mx-auto">
      {/* Back Button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => router.push("/home")}
          className="glass-card px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium text-muted hover:text-white hover:scale-105 transition-all"
          aria-label="חזרה לאתר"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          חזרה לאתר
        </button>
      </div>

      <div className="glass-card p-5 sm:p-7">
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-[20px] mb-3"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <p className="text-xl font-extrabold mb-1">בחרו את ה-DJ שלכם</p>
          <p className="text-secondary text-sm">נראה קודם את הפרופיל, נתחמם על הסגנון, ואז נתחיל את השאלון</p>
        </div>

        <div className="mb-4 rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(5,156,192,0.1),rgba(3,178,140,0.08))] px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <p className="text-sm font-semibold">הדרך הכי טובה להתחיל</p>
            <Sparkles className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-xs text-secondary mt-1">בחירת DJ כאן גם מחממת את הלקוח וגם מכניסה אותו ישר לעולם המותג שלך.</p>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפשו לפי שם DJ"
            className="w-full rounded-xl border border-glass bg-transparent py-3 pr-10 pl-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-secondary">
            טוען את רשימת הדיג׳יים...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[var(--accent-danger)]/20 bg-[var(--accent-danger)]/10 px-4 py-4 text-center text-sm" style={{ color: "var(--accent-danger)" }}>
            {error}
          </div>
        ) : filteredDjs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
            <Music2 className="w-6 h-6 text-brand-blue mx-auto mb-2" />
            <p className="text-sm font-semibold">לא מצאנו DJ בשם הזה</p>
            <p className="text-xs text-secondary mt-1">נסו לחפש בשם אחר</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60dvh] overflow-y-auto pr-1">
            {filteredDjs.map((dj) => (
              <button
                key={dj.id}
                type="button"
                onClick={() => onSelect(dj)}
                className="w-full overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] text-right transition-colors hover:bg-white/[0.05]"
              >
                <div
                  className="relative px-4 py-4 sm:px-5"
                  style={{
                    background: dj.cover_url
                      ? `linear-gradient(180deg, rgba(8,12,18,0.35), rgba(8,12,18,0.9)), url(${dj.cover_url}) center/cover`
                      : "linear-gradient(135deg, rgba(5,156,192,0.1), rgba(3,178,140,0.08), rgba(255,255,255,0.02))",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <ChevronLeft className="w-4 h-4 text-brand-blue shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-bold truncate">{dj.business_name || dj.dj_slug}</p>
                          <p className="text-[11px] text-white/55 mt-1" dir="ltr">@{dj.dj_slug}</p>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-bold text-brand-blue">
                          {dj.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={dj.logo_url} alt={dj.business_name || dj.dj_slug} className="h-full w-full object-cover" />
                          ) : (
                            getInitials(dj.business_name || dj.dj_slug)
                          )}
                        </div>
                      </div>
                      {dj.tagline ? (
                        <p className="text-sm text-white/90 leading-6 line-clamp-2">{dj.tagline}</p>
                      ) : (
                        <p className="text-sm text-white/88 leading-6">לצפייה בפרופיל, לאווירה המוזיקלית ולהתחלת התהליך</p>
                      )}
                      {dj.bio ? (
                        <p className="text-xs text-white/65 mt-2 leading-5 line-clamp-2">{dj.bio}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/75">פרופיל DJ</span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/75">פתיחת אירוע</span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] text-white/75">שאלון זוג</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
