"use client";

import { motion } from "framer-motion";
import {
  Music,
  Instagram,
  Globe,
  MessageCircle,
  ExternalLink,
  Headphones,
  Star,
  ChevronLeft,
  ChevronRight,
  Link2,
  Maximize2,
  Play,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import type { ProfileState } from "@/stores/profileStore";
import { resolveDJProfileStyleTokens } from "@/lib/djProfileStyles";

const socialLinks = [
  { key: "instagramUrl" as const, label: "Instagram", icon: <Instagram className="w-5 h-5" />, color: "#E1306C" },
  {
    key: "tiktokUrl" as const,
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
        <path d="M14.5 3v9.6a3.6 3.6 0 1 1-3-3.55" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 3c.7 2.2 2.2 3.7 4.5 4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "#ffffff",
  },
  {
    key: "youtubeUrl" as const,
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
    color: "#FF0000",
  },
  {
    key: "spotifyUrl" as const,
    label: "Spotify",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    color: "#1DB954",
  },
  {
    key: "soundcloudUrl" as const,
    label: "SoundCloud",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M4 15.5a2.5 2.5 0 1 1 .5-4.95A4.5 4.5 0 0 1 13 9a4 4 0 0 1 7.76 1.38A2.8 2.8 0 1 1 20.2 16H4Z" />
      </svg>
    ),
    color: "#FF5500",
  },
  { key: "websiteUrl" as const, label: "אתר", icon: <Globe className="w-5 h-5" />, color: "#059cc0" },
];

interface DJProfilePreviewProps {
  profile: ProfileState;
  mode: "public" | "preview";
  slug?: string;
}

type VisibleLink = { label: string; url: string };

function isVideoLink(url: string) {
  const normalized = url.toLowerCase();
  return normalized.includes("youtube.com") || normalized.includes("youtu.be") || normalized.includes("vimeo.com") || normalized.includes("instagram.com/reel") || normalized.includes("instagram.com/p/") || normalized.includes("tiktok.com");
}

function extractYoutubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || null;
    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/").filter(Boolean)[1] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function getVideoThumbnail(url: string) {
  const youtubeId = extractYoutubeVideoId(url);
  return youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null;
}

function getVideoSourceLabel(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "YouTube";
  if (normalized.includes("vimeo.com")) return "Vimeo";
  if (normalized.includes("instagram.com")) return "Instagram";
  if (normalized.includes("tiktok.com")) return "TikTok";
  return "Video";
}

export function DJProfilePreview({ profile, mode, slug }: DJProfilePreviewProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [eventNumber, setEventNumber] = useState("");

  const brandColors = profile.brandColors || { primary: profile.accentColor || "#059cc0", secondary: "#03b28c", accent: profile.accentColor || "#059cc0", surface: "#1f2937" };
  const primaryColor = brandColors.primary || "#059cc0";
  const secondaryColor = brandColors.secondary || "#03b28c";
  const accentColor = brandColors.accent || primaryColor;
  const surfaceColor = brandColors.surface || "#1f2937";
  const styleTokens = resolveDJProfileStyleTokens(profile.profileStyle);
  const logoScale = Math.min(100, Math.max(50, profile.logoScale ?? 74));

  const isGlassPremium = profile.profileStyle === "glass_premium";
  const isEditorialMono = profile.profileStyle === "editorial_mono";

  const activeSocials = socialLinks.filter((social) => {
    const value = profile[social.key];
    return value && value.trim().length > 0;
  });

  const visibleCustomLinks = (profile.customLinks || []).filter((link) => link.label && link.url);
  const videoLinks = visibleCustomLinks.filter((link) => isVideoLink(link.url));
  const utilityLinks = visibleCustomLinks.filter((link) => !isVideoLink(link.url));
  const featuredVideo = videoLinks[0] || null;
  const secondaryVideos = featuredVideo ? videoLinks.slice(1) : [];
  const galleryPhotos = profile.galleryPhotos || [];
  const reviews = profile.reviews || [];
  const whatsappLink = profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, "")}` : null;
  const effectiveSlug = slug || profile.djSlug || "";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const heroMeta = [
    galleryPhotos.length > 0 ? `${galleryPhotos.length} תמונות` : null,
    videoLinks.length > 0 ? `${videoLinks.length} סרטונים` : null,
    reviews.length > 0 ? `${reviews.length} המלצות` : null,
  ].filter(Boolean);

  const orderedSections = useMemo(() => {
    if (isEditorialMono) return ["actions", "whatsapp", "reviews", "socials", "links", "gallery", "featuredVideo", "videoRail"] as const;
    return ["actions", "whatsapp", "socials", "links", "featuredVideo", "videoRail", "gallery", "reviews"] as const;
  }, [isEditorialMono]);

  const hasAnyContent = Boolean(profile.bio?.trim() || whatsappLink || activeSocials.length > 0 || galleryPhotos.length > 0 || visibleCustomLinks.length > 0 || reviews.length > 0);

  const handleShare = async () => {
    if (mode === "preview") return;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: profile.businessName, url: pageUrl });
        return;
      }
    } catch {
      return;
    }
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      return;
    }
  };

  const renderPrimaryActions = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`${styleTokens.sectionCardClass} overflow-hidden ${isEditorialMono ? "p-0 border-white/8 bg-white/[0.02]" : "p-0"}`}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: isEditorialMono
            ? "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
            : `radial-gradient(circle at top right, ${primaryColor}20, transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_30%,transparent_70%,rgba(255,255,255,0.03))]" />
        <div className="relative p-4 sm:p-5">
          {mode === "public" ? (
            <div className="space-y-4">
              <div className="space-y-2 text-right">
                <h3 className="text-[22px] sm:text-2xl font-semibold tracking-[-0.04em] text-white leading-[1.05]">
                  מתחילים מכאן
                </h3>
                <p className="text-[13px] sm:text-sm text-white/64 leading-6 max-w-[28ch]">
                  פרופיל, פתיחה, והמשך חלק לשאלון.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/15 p-2 backdrop-blur-sm">
                <div className="grid gap-2 sm:grid-cols-[1.2fr_0.9fr_auto]">
                  <a
                    href={`/dj/${effectiveSlug}?start=1`}
                    className="group relative flex min-h-[54px] items-center justify-between overflow-hidden rounded-[18px] px-4 py-3 text-right text-white transition-all duration-200 hover:scale-[1.01] hover:opacity-95"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 14px 36px ${primaryColor}20`,
                    }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_38%,rgba(0,0,0,0.08))]" />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/15 ring-1 ring-white/10">
                        <Music className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="text-sm font-semibold tracking-[-0.02em]">נתחיל עם ה-DJ הזה</span>
                    </div>
                    <span className="relative z-10 text-[11px] text-white/70">חדש</span>
                  </a>

                  <div className="flex min-h-[54px] items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2">
                    <input
                      type="text"
                      value={eventNumber}
                      onChange={(e) => setEventNumber(e.target.value)}
                      placeholder="מספר אירוע"
                      className="flex-1 bg-transparent text-sm font-medium text-white/90 placeholder:text-white/40 focus:outline-none"
                      dir="ltr"
                    />
                    <a
                      href={eventNumber.trim() ? `/dj/${effectiveSlug}?resume=1&event=${encodeURIComponent(eventNumber.trim())}` : `/dj/${effectiveSlug}?resume=1`}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${eventNumber.trim()
                        ? "bg-white/[0.12] text-white/90 hover:bg-white/[0.18]"
                        : "bg-white/[0.05] text-white/40 pointer-events-none"
                        }`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={handleShare}
                    className="flex min-h-[54px] items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-white/[0.06]"
                    style={{ color: accentColor }}
                    type="button"
                    title={copied ? "הועתק" : "שתפו / העתיקו"}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>{copied ? "הועתק" : "שיתוף"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between gap-3 rounded-[24px] px-5 py-4 text-white opacity-85"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <Music className="w-5 h-5" />
              <div className="text-right">
                <p className="text-[11px] text-white/70 mb-1">CTA ראשי</p>
                <p className="text-base font-bold">נתחיל את המסע</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderWhatsapp = () =>
    whatsappLink ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        {mode === "public" ? (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 w-full py-4 text-white font-bold text-sm transition-opacity hover:opacity-90 ${isEditorialMono ? "rounded-full" : "rounded-[22px]"}`} style={{ background: "#25D366" }}>
            <MessageCircle className="w-5 h-5" />
            שלחו הודעה בוואטסאפ
          </a>
        ) : (
          <div className={`flex items-center justify-center gap-2 w-full py-4 text-white font-bold text-sm opacity-80 cursor-default ${isEditorialMono ? "rounded-full" : "rounded-[22px]"}`} style={{ background: "#25D366" }}>
            <MessageCircle className="w-5 h-5" />
            שלחו הודעה בוואטסאפ
          </div>
        )}
      </motion.div>
    ) : null;

  const renderSocials = () =>
    activeSocials.length > 0 ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className={isEditorialMono ? "flex justify-start" : "flex justify-center"}>
        <div className={`flex flex-wrap items-center ${isEditorialMono ? "gap-3" : "gap-4 justify-center"}`}>
          {activeSocials.map((social) => {
            const Wrapper = mode === "public" ? "a" : "div";
            const linkProps = mode === "public" ? { href: profile[social.key], target: "_blank" as const, rel: "noopener noreferrer" } : {};
            return (
              <Wrapper key={social.key} {...linkProps} className={`inline-flex items-center justify-center transition-all ${mode === "public" ? "hover:scale-[1.08] active:scale-[0.98] cursor-pointer" : ""}`} title={social.label}>
                <span className={`flex items-center justify-center shrink-0 w-11 h-11 ${isEditorialMono ? "rounded-full border border-white/8 bg-white/[0.02]" : "rounded-2xl border border-white/10 bg-white/[0.03]"}`} style={{ color: social.color }}>
                  {social.icon}
                </span>
              </Wrapper>
            );
          })}
        </div>
      </motion.div>
    ) : null;

  const renderUtilityLinks = () =>
    utilityLinks.length > 0 ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={isEditorialMono ? "flex flex-wrap gap-2 justify-start" : "flex flex-wrap gap-2 justify-center"}>
        {utilityLinks.map((link, index) =>
          mode === "public" ? (
            <a key={`${link.label}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-80 ${isEditorialMono ? "rounded-full border border-white/8 px-3 py-2" : ""}`} style={{ color: accentColor }}>
              <Link2 className="w-4 h-4" />
              {link.label}
            </a>
          ) : (
            <div key={`${link.label}-${index}`} className={`inline-flex items-center gap-2 text-xs font-medium ${isEditorialMono ? "rounded-full border border-white/8 px-3 py-2" : ""}`} style={{ color: accentColor }}>
              <Link2 className="w-4 h-4" />
              {link.label}
            </div>
          )
        )}
      </motion.div>
    ) : null;

  const renderVideoCard = (link: VisibleLink, index: number) => {
    const Wrapper = mode === "public" ? "a" : "div";
    const linkProps = mode === "public" ? { href: link.url, target: "_blank" as const, rel: "noopener noreferrer" } : {};
    const thumbnail = getVideoThumbnail(link.url);
    return (
      <Wrapper key={`${link.label}-${index}`} {...linkProps} className={`min-w-[240px] max-w-[240px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] ${mode === "public" ? "hover:bg-white/[0.07] transition-colors" : ""}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {thumbnail ? <img src={thumbnail} alt={link.label} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentColor}35, ${secondaryColor}15 55%, ${surfaceColor})` }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/85">{getVideoSourceLabel(link.url)}</div>
          <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
            <Play className="w-4 h-4 fill-current" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold line-clamp-2">{link.label}</div>
            <ExternalLink className="w-4 h-4 text-muted shrink-0" />
          </div>
          <div className="text-xs text-muted">פתיחה ישירה לוידאו / קטע הופעה</div>
        </div>
      </Wrapper>
    );
  };

  const renderFeaturedVideo = () =>
    featuredVideo ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={`${styleTokens.sectionCardClass} overflow-hidden p-0`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {getVideoThumbnail(featuredVideo.url) ? <img src={getVideoThumbnail(featuredVideo.url) || ""} alt={featuredVideo.label} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}20 50%, ${surfaceColor})` }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute left-4 top-4">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] ${styleTokens.highlightPillClass}`}>
              <Play className="h-3.5 w-3.5" />
              {getVideoSourceLabel(featuredVideo.url)}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-lg font-bold text-white line-clamp-2">{featuredVideo.label}</div>
                <div className="text-sm text-white/72">קטע נבחר מתוך ה-showreel שלך</div>
              </div>
              {mode === "public" ? (
                <a href={featuredVideo.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full bg-white text-slate-950 px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  נגן
                </a>
              ) : (
                <div className="shrink-0 rounded-full bg-white text-slate-950 px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 opacity-90">
                  <Play className="w-4 h-4 fill-current" />
                  נגן
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    ) : null;

  const renderVideoRail = (items: VisibleLink[], compact = false) =>
    items.length > 0 ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }} className={`${styleTokens.sectionCardClass} ${compact ? "p-3" : "p-3 sm:p-4"}`}>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {items.map((link, index) => renderVideoCard(link, index))}
        </div>
      </motion.div>
    ) : null;

  const renderGallery = () =>
    galleryPhotos.length > 0 ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`${styleTokens.sectionCardClass} p-3 sm:p-4`}>
        <div className={`relative ${isEditorialMono ? "aspect-[4/5]" : "aspect-[16/10]"} rounded-[24px] overflow-hidden bg-black/20`}>
          <img src={galleryPhotos[galleryIndex % galleryPhotos.length]} alt={`gallery ${galleryIndex + 1}`} className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => setLightboxOpen(true)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
          <button onClick={() => setLightboxOpen(true)} className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" title="הגדל תמונה">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {galleryPhotos.length > 1 && (
            <>
              <button onClick={() => setGalleryIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setGalleryIndex((prev) => (prev + 1) % galleryPhotos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {galleryPhotos.map((_, index) => (
                  <button key={index} onClick={() => setGalleryIndex(index)} className={`w-2 h-2 rounded-full transition-all ${index === galleryIndex % galleryPhotos.length ? "bg-white scale-125" : "bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
        </div>
        {galleryPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {galleryPhotos.map((url, index) => (
              <button key={index} onClick={() => setGalleryIndex(index)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${index === galleryIndex % galleryPhotos.length ? "scale-105" : "border-transparent opacity-60 hover:opacity-100"}`} style={index === galleryIndex % galleryPhotos.length ? { borderColor: primaryColor } : undefined}>
                <img src={url} alt={`thumb ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    ) : null;

  const renderReviews = () =>
    reviews.length > 0 ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${styleTokens.sectionCardClass} p-5 space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold">מה אומרים עליי</h3>
          <div className={`px-3 py-1.5 rounded-2xl text-[11px] ${styleTokens.highlightPillClass}`}>{reviews.length} ביקורות</div>
        </div>
        {reviews.filter((review) => review.text).map((review, index) => (
          <div key={index} className={`space-y-2 ${isEditorialMono ? "border-b border-white/8 pb-4 last:border-b-0 last:pb-0" : "p-4 rounded-2xl border border-glass bg-white/[0.02]"}`}>
            <div className="flex items-center gap-2">
              {review.name && <span className="text-sm font-medium">{review.name}</span>}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`w-3 h-3 ${star <= (review.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />)}
              </div>
            </div>
            <p className="text-xs text-secondary leading-relaxed">{review.text}</p>
          </div>
        ))}
      </motion.div>
    ) : null;

  const renderEmpty = () =>
    !hasAnyContent ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className={`${styleTokens.sectionCardClass} p-5 text-center`}>
        <p className="text-sm text-secondary leading-relaxed">{mode === "preview" ? "הוסף תוכן כדי לראות איך הפרופיל ייראה כלפי חוץ." : "ה-DJ עדיין לא הוסיף פרטים נוספים — אבל אפשר כבר להתחיל את המסע המוזיקלי."}</p>
      </motion.div>
    ) : null;

  const renderFooter = () => (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pt-2">
        <a href="/" className="text-xs text-muted hover:text-secondary transition-colors inline-flex items-center gap-1">
          Powered by <span className="font-semibold">Compakt</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>
      {lightboxOpen && galleryPhotos.length > 0 && <Lightbox images={galleryPhotos} currentIndex={galleryIndex % galleryPhotos.length} onClose={() => setLightboxOpen(false)} onNavigate={(index) => setGalleryIndex(index)} />}
    </>
  );

  const sectionMap: Record<(typeof orderedSections)[number], JSX.Element | null> = {
    actions: renderPrimaryActions(),
    whatsapp: renderWhatsapp(),
    socials: renderSocials(),
    links: renderUtilityLinks(),
    featuredVideo: renderFeaturedVideo(),
    videoRail: renderVideoRail(featuredVideo ? secondaryVideos : videoLinks, isEditorialMono),
    gallery: renderGallery(),
    reviews: renderReviews(),
  };

  return (
    <div className={mode === "preview" ? "relative overflow-hidden" : "min-h-dvh relative overflow-hidden"} style={{ background: styleTokens.pageGradient }}>
      <div className="absolute inset-0 pointer-events-none opacity-80" style={{ background: `radial-gradient(circle at top right, ${primaryColor}20, transparent 25%), radial-gradient(circle at top left, ${secondaryColor}14, transparent 20%)` }} />
      <div className="relative max-w-md mx-auto px-4 py-4 sm:py-6">
        <div className={`${styleTokens.frameClass} overflow-hidden`}>
          <div className={`p-4 sm:p-5 ${isEditorialMono ? "space-y-6" : "space-y-4"}`}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${styleTokens.heroCardClass} overflow-hidden`}>
              <div className={`relative ${isEditorialMono ? "min-h-[320px]" : "min-h-[240px]"}`}>
                {profile.coverUrl ? (
                  <>
                    <img src={profile.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: isEditorialMono ? "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.88))" : `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.76)), linear-gradient(135deg, ${primaryColor}20, transparent 45%, ${secondaryColor}15)` }} />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}66, ${secondaryColor}33 55%, ${surfaceColor})` }} />
                )}
                <div className={`relative z-10 p-5 flex flex-col ${isEditorialMono ? "justify-between" : "justify-end"} h-full`}>
                  <div className="flex items-center justify-between gap-3" />
                  {isEditorialMono ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        {profile.logoUrl ? (
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 shadow-lg shrink-0">
                            <img src={profile.logoUrl} alt="logo" className={`w-full h-full ${profile.logoFit === "cover" ? "object-cover" : "object-contain"}`} style={{ transform: `scale(${logoScale / 100})` }} />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                            <Headphones className="w-8 h-8" />
                          </div>
                        )}
                        <div className="min-w-0">
                          {heroMeta.length > 0 && <div className="mb-3 text-[10px] uppercase tracking-[0.32em] text-white/45">{heroMeta.join(" · ")}</div>}
                          <h1 className="text-3xl sm:text-[40px] font-semibold leading-[0.95] tracking-[-0.05em] text-white text-balance">{profile.businessName || "שם העסק שלך"}</h1>
                          {profile.tagline && <p className="mt-3 text-[15px] text-white/78 leading-7 max-w-[18rem]">{profile.tagline}</p>}
                        </div>
                      </div>
                      {profile.bio && <p className="text-[14px] text-white/66 leading-7 max-w-[18rem]">{profile.bio}</p>}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-end gap-3">
                        {profile.logoUrl ? (
                          <div className={`rounded-2xl overflow-hidden border border-white/15 shadow-lg shrink-0 ${isEditorialMono ? "w-12 h-12" : "w-14 h-14"}`}>
                            <img src={profile.logoUrl} alt="logo" className={`w-full h-full ${profile.logoFit === "cover" ? "object-cover" : "object-contain"}`} style={{ transform: `scale(${logoScale / 100})` }} />
                          </div>
                        ) : (
                          <div className={`rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${isEditorialMono ? "w-12 h-12" : "w-14 h-14"}`} style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                            <Headphones className={isEditorialMono ? "w-6 h-6" : "w-7 h-7"} />
                          </div>
                        )}
                        <div className="min-w-0">
                          {heroMeta.length > 0 && <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/48">{heroMeta.join(" · ")}</div>}
                          <h1 className={`${isEditorialMono ? "text-xl" : "text-[32px] sm:text-[38px]"} font-semibold leading-[0.96] tracking-[-0.055em] text-white text-balance`}>
                            {profile.businessName || "שם העסק שלך"}
                          </h1>
                          {profile.tagline && <p className={`mt-3 text-white/76 leading-7 ${isEditorialMono ? "text-xs" : "text-[15px] max-w-[26ch]"}`}>{profile.tagline}</p>}
                        </div>
                      </div>
                      {profile.bio && (
                        <p className={`${isEditorialMono ? "max-w-[15rem] text-sm leading-7 text-white/76" : "max-w-[32ch] text-[14px] leading-7 text-white/62"}`}>
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            {!isEditorialMono && profile.bio && isGlassPremium && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className={`${styleTokens.sectionCardClass} p-4`} style={{ borderColor: `${surfaceColor}88` }}>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">{profile.bio}</p>
              </motion.div>
            )}
            {orderedSections.map((section) => <div key={section}>{sectionMap[section]}</div>)}
            {renderEmpty()}
            {renderFooter()}
          </div>
        </div>
      </div>
    </div>
  );
}
