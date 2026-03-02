"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Eye, Image as ImageIcon, Link2, MessageSquareQuote, Palette, Pencil, Plus, Save, Settings, Share2, Star, Trash2, User } from "lucide-react";
import { DJProfilePreview } from "@/components/dj/DJProfilePreview";
import { useProfileStore } from "@/stores/profileStore";
import { useAdminStore } from "@/stores/adminStore";
import { ImageUploader } from "@/components/ui/ImageUploader";
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
  const saveProfileToDB = useProfileStore((s) => s.saveProfileToDB);
  const userId = useAdminStore((s) => s.userId);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const djLink = useMemo(() => {
    const slug = profile.djSlug.trim();
    if (!slug) return "";
    return `${getSafeOrigin()}/dj/${slug}`;
  }, [profile.djSlug]);

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors";

  const handleSave = async () => {
    setSaveError(null);

    if (!profile.djSlug.trim()) {
      setSaveError("חובה להגדיר כתובת (slug) כדי לפרסם דף DJ");
      return;
    }

    setSaving(true);
    try {
      await saveProfileToDB(userId || "legacy");
    } catch (e) {
      const errObj = typeof e === "object" && e ? (e as Record<string, unknown>) : null;

      const baseMessage =
        e instanceof Error
          ? e.message
          : errObj && typeof errObj.message === "string"
            ? errObj.message
            : null;

      const extraParts: string[] = [];
      if (errObj && typeof errObj.code === "string") extraParts.push(`code: ${errObj.code}`);
      if (errObj && typeof errObj.details === "string" && errObj.details.trim()) extraParts.push(errObj.details);
      if (errObj && typeof errObj.hint === "string" && errObj.hint.trim()) extraParts.push(errObj.hint);

      const message = [baseMessage || "שמירה נכשלה", ...extraParts].join("\n");
      setSaveError(message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyLink = async () => {
    if (!djLink) return;
    await navigator.clipboard.writeText(djLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header with save */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-blue" />
          פרופיל
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary text-sm flex items-center gap-2 py-2.5 px-5 ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "שומר..." : saved ? "נשמר!" : "שמור"}
        </button>
      </div>

      {saveError && (
        <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
          {saveError}
        </div>
      )}

      {/* Mobile tab switcher */}
      <div className="flex lg:hidden rounded-xl border border-glass overflow-hidden">
        <button
          onClick={() => setMobileTab("edit")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mobileTab === "edit"
            ? "bg-brand-blue text-white"
            : "bg-transparent text-secondary hover:text-primary"
            }`}
        >
          <Pencil className="w-4 h-4" />
          עריכה
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mobileTab === "preview"
            ? "bg-brand-blue text-white"
            : "bg-transparent text-secondary hover:text-primary"
            }`}
        >
          <Eye className="w-4 h-4" />
          תצוגה מקדימה
        </button>
      </div>

      {/* Split layout: form left, preview right */}
      <div className="flex gap-6 items-start">
        {/* Left: Edit form */}
        <div className={`flex-1 min-w-0 space-y-6 ${mobileTab === "edit" ? "block" : "hidden lg:block"}`}>

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
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">לוגו (URL)</label>
                <input
                  type="url"
                  value={profile.logoUrl}
                  onChange={(e) => setProfile({ logoUrl: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Gallery Photos */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-blue" />
              תיק עבודות (גלריית תמונות)
            </h3>
            {userId ? (
              <ImageUploader
                images={profile.galleryPhotos}
                onChange={(imgs) => setProfile({ galleryPhotos: imgs })}
                userId={userId}
                maxImages={10}
                folder="gallery"
              />
            ) : (
              <p className="text-xs text-muted">התחברו עם אימייל כדי להעלות תמונות</p>
            )}
            {/* URL paste fallback */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="או הדביקו URL של תמונה"
                className={inputClass}
                dir="ltr"
                id="gallery-url-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      setProfile({ galleryPhotos: [...profile.galleryPhotos, input.value.trim()] });
                      input.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("gallery-url-input") as HTMLInputElement;
                  if (input?.value.trim()) {
                    setProfile({ galleryPhotos: [...profile.galleryPhotos, input.value.trim()] });
                    input.value = "";
                  }
                }}
                className="btn-primary text-sm px-4 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Links */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-blue" />
              לינקים מותאמים
            </h3>
            {profile.customLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const updated = [...profile.customLinks];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setProfile({ customLinks: updated });
                  }}
                  placeholder="שם הלינק"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...profile.customLinks];
                    updated[i] = { ...updated[i], url: e.target.value };
                    setProfile({ customLinks: updated });
                  }}
                  placeholder="https://..."
                  className={`${inputClass} flex-1`}
                  dir="ltr"
                />
                <button
                  onClick={() => {
                    const updated = [...profile.customLinks];
                    updated.splice(i, 1);
                    setProfile({ customLinks: updated });
                  }}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setProfile({ customLinks: [...profile.customLinks, { label: "", url: "" }] })}
              className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              הוסף לינק
            </button>
          </div>

          {/* Reviews */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-brand-blue" />
              ביקורות
            </h3>
            {profile.reviews.map((review, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl border border-glass">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={review.name}
                    onChange={(e) => {
                      const updated = [...profile.reviews];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setProfile({ reviews: updated });
                    }}
                    placeholder="שם"
                    className={`${inputClass} flex-1`}
                  />
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          const updated = [...profile.reviews];
                          updated[i] = { ...updated[i], rating: star };
                          setProfile({ reviews: updated });
                        }}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...profile.reviews];
                      updated.splice(i, 1);
                      setProfile({ reviews: updated });
                    }}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={review.text}
                  onChange={(e) => {
                    const updated = [...profile.reviews];
                    updated[i] = { ...updated[i], text: e.target.value };
                    setProfile({ reviews: updated });
                  }}
                  placeholder="תוכן הביקורת..."
                  className={`${inputClass} min-h-[60px] resize-y`}
                  rows={2}
                />
              </div>
            ))}
            <button
              onClick={() => setProfile({ reviews: [...profile.reviews, { name: "", text: "", rating: 5 }] })}
              className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              הוסף ביקורת
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className={`w-[420px] flex-shrink-0 sticky top-4 ${mobileTab === "preview" ? "block" : "hidden lg:block"}`}>
          <div className="rounded-2xl border border-glass overflow-hidden shadow-lg">
            <div className="bg-white/[0.03] border-b border-glass px-4 py-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-blue" />
              <span className="text-xs font-medium text-secondary">תצוגה מקדימה</span>
            </div>
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
              <DJProfilePreview profile={profile} mode="preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
