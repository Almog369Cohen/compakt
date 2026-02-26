"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2, Palette, Save, Settings, Share2, User } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { getSafeOrigin } from "@/lib/utils";

const ACCENT_COLORS = [
  "#059cc0",
  "#03b28c",
  "#d4627a",
  "#f5c542",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#06b6d4",
];

export function ProfileSettings() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const djLink = useMemo(() => {
    const slug = profile.djSlug.trim();
    if (!slug) return "";
    return `${getSafeOrigin()}/dj/${slug}`;
  }, [profile.djSlug]);

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors";

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const copyLink = async () => {
    if (!djLink) return;
    await navigator.clipboard.writeText(djLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-blue" />
          פרופיל
        </h2>
        <button
          onClick={handleSave}
          className="btn-primary text-sm flex items-center gap-2 py-2.5 px-5"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "נשמר" : "שמור"}
        </button>
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <User className="w-4 h-4 text-brand-blue" />
          פרטי עסק
        </h3>

        <div>
          <label className="block text-xs text-muted mb-1.5 font-medium">שם העסק / שם DJ</label>
          <input
            type="text"
            value={profile.businessName}
            onChange={(e) => setProfile({ businessName: e.target.value })}
            placeholder="DJ Almog"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5 font-medium">סלוגן</label>
          <input
            type="text"
            value={profile.tagline}
            onChange={(e) => setProfile({ tagline: e.target.value })}
            placeholder="המוזיקה שלכם, הדרך שלכם"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1.5 font-medium">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ bio: e.target.value })}
            placeholder="ספרו קצת על הסגנון והניסיון שלכם..."
            className={`${inputClass} min-h-[80px] resize-y`}
            rows={3}
          />
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-blue" />
          מיתוג
        </h3>

        <div>
          <label className="block text-xs text-muted mb-2 font-medium">צבע מותג</label>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setProfile({ accentColor: color })}
                className={`w-10 h-10 rounded-xl transition-all ${profile.accentColor === color
                  ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] scale-110"
                  : "hover:scale-105"
                  }`}
                style={{
                  background: color,
                  // @ts-expect-error -- ring color
                  "--tw-ring-color": color,
                }}
                aria-label={`בחר צבע ${color}`}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-brand-blue" />
          כתובת אישית
        </h3>

        <div>
          <label className="block text-xs text-muted mb-1.5 font-medium">כתובת (באנגלית)</label>
          <div className="flex items-center gap-0 rounded-xl border border-glass overflow-hidden">
            <span
              className="text-xs text-muted px-3 py-3 bg-white/[0.03] border-l border-glass whitespace-nowrap"
              dir="ltr"
            >
              /dj/
            </span>
            <input
              type="text"
              value={profile.djSlug}
              onChange={(e) =>
                setProfile({
                  djSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
              placeholder="your-name"
              dir="ltr"
              className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-sm"
            />
          </div>
        </div>

        {djLink && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/10">
            <Link2 className="w-4 h-4 text-brand-blue flex-shrink-0" />
            <code className="text-xs text-secondary truncate flex-1" dir="ltr">
              {djLink}
            </code>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `היי! הנה הפרופיל שלי 🎵\n${djLink}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md hover:bg-brand-green/10 transition-colors"
              title="שלח בוואטסאפ"
            >
              <Share2 className="w-3.5 h-3.5 text-brand-green" />
            </a>
            <button
              onClick={copyLink}
              className="text-xs text-brand-blue hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "הועתק" : "העתק"}
            </button>
          </div>
        )}
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-brand-blue" />
          רשתות ויצירת קשר
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">אינסטגרם</label>
            <input
              type="url"
              value={profile.instagramUrl}
              onChange={(e) => setProfile({ instagramUrl: e.target.value })}
              placeholder="https://instagram.com/..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">טיקטוק</label>
            <input
              type="url"
              value={profile.tiktokUrl}
              onChange={(e) => setProfile({ tiktokUrl: e.target.value })}
              placeholder="https://tiktok.com/@..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">SoundCloud</label>
            <input
              type="url"
              value={profile.soundcloudUrl}
              onChange={(e) => setProfile({ soundcloudUrl: e.target.value })}
              placeholder="https://soundcloud.com/..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">Spotify</label>
            <input
              type="url"
              value={profile.spotifyUrl}
              onChange={(e) => setProfile({ spotifyUrl: e.target.value })}
              placeholder="https://open.spotify.com/..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">YouTube</label>
            <input
              type="url"
              value={profile.youtubeUrl}
              onChange={(e) => setProfile({ youtubeUrl: e.target.value })}
              placeholder="https://youtube.com/@..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">אתר</label>
            <input
              type="url"
              value={profile.websiteUrl}
              onChange={(e) => setProfile({ websiteUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">וואטסאפ</label>
            <input
              type="tel"
              value={profile.whatsappNumber}
              onChange={(e) => setProfile({ whatsappNumber: e.target.value })}
              placeholder="0501234567"
              className={inputClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-medium">תמונת קאבר (URL)</label>
            <input
              type="url"
              value={profile.coverUrl}
              onChange={(e) => setProfile({ coverUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
