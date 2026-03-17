"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Check, Copy, Eye, GripVertical, Image as ImageIcon, LayoutTemplate, Link2, MessageSquareQuote, Palette, Pencil, PlayCircle, Plus, Save, Settings, Share2, Star, Trash2, User } from "lucide-react";
import { DJProfilePreview } from "@/components/dj/DJProfilePreview";
import { useProfileStore } from "@/stores/profileStore";
import { useAdminStore } from "@/stores/adminStore";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { getSafeOrigin } from "@/lib/utils";
import { safeCopyText } from "@/lib/clipboard";
import { DJ_PROFILE_STYLE_OPTIONS } from "@/lib/djProfileStyles";
import { useTranslation } from "@/lib/i18n";

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


const DEFAULT_BRAND_COLORS = {
  primary: "#059cc0",
  secondary: "#03b28c",
  accent: "#8b5cf6",
  surface: "#1f2937",
};

export function ProfileSettings() {
  const { t } = useTranslation("admin");
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const saveProfileToDB = useProfileStore((s) => s.saveProfileToDB);
  const userId = useAdminStore((s) => s.userId);
  const brandColors = profile.brandColors || DEFAULT_BRAND_COLORS;
  const businessName = profile.businessName || "";
  const tagline = profile.tagline || "";
  const bio = profile.bio || "";
  const djSlugValue = profile.djSlug || "";
  const instagramUrl = profile.instagramUrl || "";
  const tiktokUrl = profile.tiktokUrl || "";
  const soundcloudUrl = profile.soundcloudUrl || "";
  const spotifyUrl = profile.spotifyUrl || "";
  const youtubeUrl = profile.youtubeUrl || "";
  const websiteUrl = profile.websiteUrl || "";
  const whatsappNumber = profile.whatsappNumber || "";
  const coverUrl = profile.coverUrl || "";
  const logoUrl = profile.logoUrl || "";
  const customLinks = Array.isArray(profile.customLinks) ? profile.customLinks : [];
  const galleryPhotos = Array.isArray(profile.galleryPhotos) ? profile.galleryPhotos : [];
  const reviews = Array.isArray(profile.reviews) ? profile.reviews : [];
  const logoFit = profile.logoFit === "cover" ? "cover" : "contain";
  const logoScale = typeof profile.logoScale === "number" ? profile.logoScale : 74;

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const djLink = useMemo(() => {
    const slug = djSlugValue.trim();
    if (!slug) return "";
    return `${getSafeOrigin()}/dj/${slug}`;
  }, [djSlugValue]);

  const selectedStyleMeta = DJ_PROFILE_STYLE_OPTIONS.find((option) => option.value === profile.profileStyle);

  const BRAND_COLOR_FIELDS = useMemo(() => [
    { key: "primary" as const, label: t("profile.colors.primary") },
    { key: "secondary" as const, label: t("profile.colors.secondary") },
    { key: "accent" as const, label: t("profile.colors.accent") },
    { key: "surface" as const, label: t("profile.colors.surface") },
  ], [t]);

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors";
  const sectionClass = "rounded-[28px] border border-glass bg-white/[0.03] p-4 md:p-5 space-y-4";

  const handleSave = async () => {
    setSaveError(null);

    if (!djSlugValue.trim()) {
      setSaveError(t("profile.errors.slugRequired"));
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

      const message = [baseMessage || t("profile.errors.saveFailed"), ...extraParts].join("\n");
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
    const copiedOk = await safeCopyText(djLink);
    if (!copiedOk) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const updateBrandColor = (
    key: keyof typeof DEFAULT_BRAND_COLORS,
    value: string
  ) => {
    setProfile({
      brandColors: {
        ...brandColors,
        [key]: value,
      },
    });
  };

  const uploaderUserId = userId || "legacy";

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-glass bg-[linear-gradient(135deg,rgba(5,156,192,0.12),rgba(255,255,255,0.03),rgba(3,178,140,0.08))] p-5 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-secondary">
              <LayoutTemplate className="w-3.5 h-3.5 text-brand-blue" />
              DJ Profile Studio
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-blue" />
              {t("profile.title")}
            </h2>
            <p className="text-sm text-secondary max-w-2xl leading-6">
              {t("profile.subtitle")}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary text-sm flex items-center gap-2 py-2.5 px-5 ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? t("profile.saving") : saved ? t("profile.saved") : t("profile.save")}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
          {saveError}
        </div>
      )}

      <div className="flex lg:hidden rounded-xl border border-glass overflow-hidden">
        <button
          onClick={() => setMobileTab("edit")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mobileTab === "edit"
            ? "bg-brand-blue text-white"
            : "bg-transparent text-secondary hover:text-primary"
            }`}
        >
          <Pencil className="w-4 h-4" />
          {t("profile.tabs.edit")}
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${mobileTab === "preview"
            ? "bg-brand-blue text-white"
            : "bg-transparent text-secondary hover:text-primary"
            }`}
        >
          <Eye className="w-4 h-4" />
          {t("profile.tabs.preview")}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <div className={`flex-1 min-w-0 space-y-6 ${mobileTab === "edit" ? "block" : "hidden lg:block"}`}>

          <div className={sectionClass}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-brand-blue" />
              {t("profile.sections.business")}
            </h3>

            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.businessName")}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setProfile({ businessName: e.target.value })}
                placeholder="DJ Almog"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.tagline")}</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setProfile({ tagline: e.target.value })}
                placeholder={t("profile.fields.taglinePlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setProfile({ bio: e.target.value })}
                placeholder={t("profile.fields.bioPlaceholder")}
                className={`${inputClass} min-h-[88px] resize-y`}
                rows={3}
              />
            </div>
          </div>

          <div className={`${sectionClass} space-y-5`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-blue" />
              {t("profile.sections.branding")}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.designStyle")}</label>
                <p className="text-xs text-muted">
                  {t("profile.fields.designStyleHint")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {DJ_PROFILE_STYLE_OPTIONS.map((styleOption) => {
                  const active = profile.profileStyle === styleOption.value;
                  return (
                    <button
                      key={styleOption.value}
                      type="button"
                      onClick={() => setProfile({ profileStyle: styleOption.value })}
                      className={`rounded-[24px] border p-3 text-right transition-all ${active
                        ? "border-brand-blue bg-brand-blue/10 shadow-[0_0_0_1px_rgba(5,156,192,0.25)]"
                        : "border-glass hover:border-brand-blue/30 hover:bg-white/[0.02]"
                        }`}
                    >
                      <div
                        className="h-24 rounded-xl border border-white/10 mb-3"
                        style={{ background: styleOption.preview }}
                      />
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold">{styleOption.shortName}</div>
                          {active && (
                            <span className="text-[11px] px-2 py-1 rounded-full bg-brand-blue/15 text-brand-blue">
                              {t("profile.fields.active")}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted leading-5">{styleOption.description}</div>
                        <div className="text-[11px] text-secondary/90">{styleOption.hero}</div>
                        <div className="text-[11px] text-muted">{styleOption.structure}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedStyleMeta && (
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GripVertical className="w-4 h-4 text-brand-blue" />
                  {t("profile.fields.activeStructure")}
                </div>
                <div className="text-xs text-secondary">{selectedStyleMeta.hero}</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-xs text-muted">
                  {selectedStyleMeta.structure}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-muted mb-2 font-medium">{t("profile.fields.advancedColors")}</label>
              <p className="text-xs text-muted mb-3">{t("profile.fields.advancedColorsHint")}</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {BRAND_COLOR_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-xs text-muted font-medium">{field.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColors[field.key]}
                        onChange={(e) => updateBrandColor(field.key, e.target.value)}
                        className="h-10 w-12 rounded-lg border border-glass bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={brandColors[field.key]}
                        onChange={(e) => updateBrandColor(field.key, e.target.value)}
                        className={`${inputClass} flex-1`}
                        dir="ltr"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-2 font-medium">{t("profile.fields.quickColorPicker")}</label>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBrandColor("primary", color)}
                    className={`w-10 h-10 rounded-xl transition-all ${brandColors.primary === color
                      ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] scale-110"
                      : "hover:scale-105"
                      }`}
                    style={{
                      background: color,
                      "--tw-ring-color": color,
                    } as CSSProperties}
                    aria-label={`${t("profile.fields.selectColor")} ${color}`}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-blue" />
              {t("profile.sections.slug")}
            </h3>

            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.slug")}</label>
              <div className="flex items-center gap-0 rounded-xl border border-glass overflow-hidden">
                <span
                  className="text-xs text-muted px-3 py-3 bg-white/[0.03] border-l border-glass whitespace-nowrap"
                  dir="ltr"
                >
                  /dj/
                </span>
                <input
                  type="text"
                  value={djSlugValue}
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
                  href={djLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t("profile.fields.open")}
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${t("profile.fields.whatsappMessage")}\n${djLink}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-md hover:bg-brand-green/10 transition-colors"
                  title={t("profile.fields.sendWhatsapp")}
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-green" />
                </a>
                <button
                  onClick={copyLink}
                  className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t("profile.fields.copied") : t("profile.fields.copy")}
                </button>
              </div>
            )}
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-blue" />
              {t("profile.sections.visuals")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.instagram")}</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setProfile({ instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.tiktok")}</label>
                <input
                  type="url"
                  value={tiktokUrl}
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
                  value={soundcloudUrl}
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
                  value={spotifyUrl}
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
                  value={youtubeUrl}
                  onChange={(e) => setProfile({ youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/@..."
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.website")}</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setProfile({ websiteUrl: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.whatsapp")}</label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setProfile({ whatsappNumber: e.target.value })}
                  placeholder="0501234567"
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.coverImage")}</label>
                <ImageUploader
                  images={coverUrl ? [coverUrl] : []}
                  onChange={(imgs) => setProfile({ coverUrl: imgs[0] || "" })}
                  userId={uploaderUserId}
                  maxImages={1}
                  folder="cover"
                />
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setProfile({ coverUrl: e.target.value })}
                  placeholder={t("profile.fields.urlPlaceholder")}
                  className={`${inputClass} mt-2`}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.logo")}</label>
                <ImageUploader
                  images={logoUrl ? [logoUrl] : []}
                  onChange={(imgs) => setProfile({ logoUrl: imgs[0] || "" })}
                  userId={uploaderUserId}
                  maxImages={1}
                  folder="logo"
                />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setProfile({ logoUrl: e.target.value })}
                  placeholder={t("profile.fields.urlPlaceholder")}
                  className={`${inputClass} mt-2`}
                  dir="ltr"
                />
                <div className="mt-3 space-y-3 rounded-2xl border border-glass p-3">
                  <div>
                    <label className="block text-xs text-muted mb-1.5 font-medium">{t("profile.fields.logoFitLabel")}</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProfile({ logoFit: "contain" })}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs transition-colors ${logoFit === "contain"
                          ? "bg-brand-blue text-white"
                          : "border border-glass text-secondary hover:text-primary"
                          }`}
                      >
                        {t("profile.fields.logoFitCover")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile({ logoFit: "cover" })}
                        className={`flex-1 rounded-xl px-3 py-2 text-xs transition-colors ${logoFit === "cover"
                          ? "bg-brand-blue text-white"
                          : "border border-glass text-secondary hover:text-primary"
                          }`}
                      >
                        {t("profile.fields.logoFitContain")}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <label className="block text-xs text-muted font-medium">{t("profile.fields.logoScaleLabel")}</label>
                      <span className="text-xs text-muted">{logoScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="2"
                      value={logoScale}
                      onChange={(e) => setProfile({ logoScale: Number(e.target.value) })}
                      className="w-full accent-brand-blue"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-blue" />
              {t("profile.fields.galleryTitle")}
            </h3>
            {uploaderUserId ? (
              <ImageUploader
                images={galleryPhotos}
                onChange={(imgs) => setProfile({ galleryPhotos: imgs })}
                userId={uploaderUserId}
                maxImages={10}
                folder="gallery"
              />
            ) : (
              <p className="text-xs text-muted">{t("profile.fields.galleryLoginRequired")}</p>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder={t("profile.fields.galleryUrlPlaceholder")}
                className={inputClass}
                dir="ltr"
                id="gallery-url-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      setProfile({ galleryPhotos: [...galleryPhotos, input.value.trim()] });
                      input.value = "";
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("gallery-url-input") as HTMLInputElement | null;
                  if (input?.value.trim()) {
                    setProfile({ galleryPhotos: [...galleryPhotos, input.value.trim()] });
                    input.value = "";
                  }
                }}
                className="btn-primary text-sm px-4 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-brand-blue" />
              {t("profile.fields.customLinksTitle")}
            </h3>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-secondary leading-6">
              {t("profile.fields.customLinksHint")}
            </div>
            {customLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => {
                    const updated = [...customLinks];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setProfile({ customLinks: updated });
                  }}
                  placeholder={t("profile.fields.customLinkLabel")}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...customLinks];
                    updated[i] = { ...updated[i], url: e.target.value };
                    setProfile({ customLinks: updated });
                  }}
                  placeholder="https://..."
                  className={`${inputClass} flex-1`}
                  dir="ltr"
                />
                <button
                  onClick={() => {
                    const updated = [...customLinks];
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
              onClick={() => setProfile({ customLinks: [...customLinks, { label: "", url: "" }] })}
              className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              {t("profile.fields.addCustomLink")}
            </button>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-brand-blue" />
                {t("profile.fields.reviewsTitle")}
              </h3>
              <button
                onClick={async () => {
                  const slug = djSlugValue.trim();
                  if (!slug) {
                    alert(t("profile.fields.reviewsSlugRequired"));
                    return;
                  }
                  const reviewLink = `${getSafeOrigin()}/dj/${slug}/review`;
                  const success = await safeCopyText(reviewLink);
                  if (success) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-dashboard-border bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-secondary hover:text-foreground hover:bg-white/[0.08] hover:border-dashboard-border-hover transition-all"
                title={t("profile.fields.reviewLinkTitle")}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied ? t("profile.fields.reviewLinkCopied") : t("profile.fields.reviewLinkLabel")}
              </button>
            </div>
            {reviews.map((review, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl border border-glass">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={review.name}
                    onChange={(e) => {
                      const updated = [...reviews];
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
                          const updated = [...reviews];
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
                      const updated = [...reviews];
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
                    const updated = [...reviews];
                    updated[i] = { ...updated[i], text: e.target.value };
                    setProfile({ reviews: updated });
                  }}
                  placeholder={t("profile.fields.reviewTextPlaceholder")}
                  className={`${inputClass} min-h-[60px] resize-y`}
                  rows={2}
                />
              </div>
            ))}
            <button
              onClick={() => setProfile({ reviews: [...reviews, { name: "", text: "", rating: 5 }] })}
              className="btn-secondary text-sm flex items-center gap-2 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              {t("profile.fields.addReviewButton")}
            </button>
          </div>
        </div>

        <div className={`w-[420px] flex-shrink-0 sticky top-4 ${mobileTab === "preview" ? "block" : "hidden lg:block"}`}>
          <div className="rounded-[28px] border border-glass overflow-hidden shadow-lg bg-black/20">
            <div className="bg-white/[0.03] border-b border-glass px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-blue" />
                <span className="text-xs font-medium text-secondary">{t("profile.fields.previewLabel")}</span>
              </div>
              {selectedStyleMeta && (
                <span className="text-[11px] rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-muted">
                  {selectedStyleMeta.shortName}
                </span>
              )}
            </div>
            {selectedStyleMeta && (
              <div className="px-4 py-3 border-b border-glass bg-black/20">
                <div className="text-[11px] text-secondary leading-5">
                  {selectedStyleMeta.structure}
                </div>
              </div>
            )}
            <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
              <DJProfilePreview profile={profile} mode="preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
