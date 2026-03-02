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
} from "lucide-react";
import { useState } from "react";
import { Lightbox } from "@/components/ui/Lightbox";
import type { ProfileState } from "@/stores/profileStore";

/* ── social link config ── */
const socialLinks = [
  {
    key: "instagramUrl" as const,
    label: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "#E1306C",
  },
  {
    key: "tiktokUrl" as const,
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.76 1.5V6.8a4.83 4.83 0 0 1-1-.11z" />
      </svg>
    ),
    color: "#000000",
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
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.192-1.308-.21-1.332c-.013-.06-.045-.094-.104-.094m1.8-1.035c-.065 0-.111.054-.12.12l-.214 2.34.227 2.274c.009.065.055.12.12.12.063 0 .111-.055.12-.12l.248-2.274-.263-2.34c-.009-.066-.055-.12-.12-.12m.899-.015c-.073 0-.126.06-.132.132l-.193 2.355.207 2.313c.006.075.06.132.132.132.072 0 .126-.057.131-.132l.227-2.313-.24-2.355c-.006-.072-.06-.132-.132-.132m.93-.222c-.081 0-.14.067-.147.146l-.174 2.577.186 2.31c.007.08.066.147.147.147.08 0 .14-.067.146-.147l.208-2.31-.22-2.577c-.007-.08-.067-.146-.147-.146m.942-.036c-.09 0-.155.074-.161.162l-.155 2.613.168 2.332c.006.09.072.162.162.162.088 0 .155-.074.16-.162l.184-2.332-.195-2.613c-.006-.09-.072-.162-.161-.162m.94.01c-.098 0-.168.08-.175.177l-.136 2.603.15 2.347c.006.098.076.177.174.177.098 0 .169-.08.176-.177l.167-2.347-.18-2.603c-.006-.098-.076-.177-.175-.177m.94-.11c-.106 0-.18.087-.187.192l-.12 2.713.132 2.35c.007.104.08.191.186.191.105 0 .18-.087.186-.192l.147-2.35-.16-2.713c-.006-.105-.08-.192-.186-.192m1.066.012c-.054 0-.102.025-.135.066-.033.04-.05.091-.05.145l-.003.023-.11 2.467.115 2.33c.002.057.025.108.066.146.04.038.093.06.15.06.054 0 .104-.023.142-.06.04-.04.063-.09.065-.147l.003-.023.127-2.307-.14-2.49c-.002-.057-.025-.106-.066-.145-.04-.04-.09-.06-.147-.06m.878-1.008c-.12 0-.214.098-.22.22l-.093 3.478.1 2.322c.006.12.1.22.22.22.12 0 .214-.098.22-.22l.112-2.322-.124-3.478c-.006-.12-.1-.22-.22-.22m1.088-.065c-.132 0-.24.108-.246.24l-.074 3.543.08 2.306c.006.132.114.24.246.24.13 0 .24-.108.245-.24l.09-2.306-.1-3.543c-.006-.132-.115-.24-.246-.24m1.108.014c-.144 0-.26.118-.264.262l-.056 3.529.06 2.286c.004.144.12.262.264.262.142 0 .26-.118.264-.262l.068-2.286-.08-3.53c-.004-.143-.12-.26-.264-.26m1.176-.138c-.078 0-.148.033-.2.088-.052.054-.082.126-.084.204l-.036 3.667.04 2.274c.002.078.033.15.088.2.054.054.126.082.204.084.078 0 .148-.033.2-.086.052-.054.082-.126.084-.204l.044-2.268-.054-3.667c-.002-.08-.033-.15-.086-.204-.054-.052-.126-.082-.204-.084m1.142-.226c-.16 0-.29.13-.295.29l-.018 3.893.02 2.242c.006.16.136.29.295.29.16 0 .29-.13.295-.29l.024-2.242-.034-3.893c-.006-.16-.136-.29-.295-.29m1.04-.006c-.082 0-.16.034-.215.09-.056.058-.088.136-.09.22v.008l-.014 3.893.016 2.233v.01c.002.066.03.128.074.178.058.062.14.098.228.098.08 0 .155-.03.212-.084.058-.06.09-.134.093-.22l.002-.02.02-2.195-.03-3.893v-.008c-.002-.084-.034-.16-.09-.22-.056-.056-.136-.09-.218-.09m1.816.167c-.234 0-.424.19-.428.424l-.005 3.722.01 2.215c.004.234.194.424.428.424.106 0 .2-.042.272-.11.07-.07.112-.166.116-.28l-.002-.043.014-2.206-.02-3.718c-.004-.236-.194-.428-.43-.428m1.348-.36c-.052 0-.104.006-.155.018-1.5.36-1.764.444-1.93.494-.154.048-.27.168-.3.33v3.47c0 .002 0 .006-.003.01v.54c.003.29.242.526.534.526 1.5 0 3.528-1.212 3.528-3.69 0-1.932-1.242-3.12-2.67-3.12" />
      </svg>
    ),
    color: "#FF5500",
  },
  {
    key: "websiteUrl" as const,
    label: "אתר",
    icon: <Globe className="w-5 h-5" />,
    color: "#059cc0",
  },
];

interface DJProfilePreviewProps {
  profile: ProfileState;
  mode: "public" | "preview";
  slug?: string;
}

export function DJProfilePreview({ profile, mode, slug }: DJProfilePreviewProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const accentColor = profile.accentColor || "#059cc0";

  const activeSocials = socialLinks.filter((s) => {
    const val = profile[s.key];
    return val && val.trim().length > 0;
  });

  const customLinks = profile.customLinks || [];
  const galleryPhotos = profile.galleryPhotos || [];
  const reviews = profile.reviews || [];

  const whatsappLink = profile.whatsappNumber
    ? `https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  const hasAnyContent = Boolean(
    profile.bio?.trim() ||
    whatsappLink ||
    activeSocials.length > 0 ||
    galleryPhotos.length > 0 ||
    customLinks.length > 0 ||
    reviews.length > 0
  );

  const effectiveSlug = slug || profile.djSlug || "";

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (mode === "preview") return;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: profile.businessName, url: pageUrl });
        return;
      }
    } catch {
      // ignore
    }

    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className={mode === "preview" ? "gradient-hero" : "min-h-dvh gradient-hero"}>
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        {profile.coverUrl ? (
          <div className="h-48 sm:h-64 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.coverUrl}
              alt="cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]" />
          </div>
        ) : (
          <div
            className="h-48 sm:h-64 w-full"
            style={{
              background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]" />
          </div>
        )}

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 max-w-md mx-auto text-center"
          >
            {profile.logoUrl ? (
              <div className="w-16 h-16 rounded-full mb-3 -mt-12 overflow-hidden border-2 border-glass mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.logoUrl} alt="logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 -mt-12"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
              >
                <Headphones className="w-8 h-8 text-white" />
              </div>
            )}

            <h1 className="text-2xl font-bold mb-1">{profile.businessName || "שם העסק שלך"}</h1>
            {profile.tagline && (
              <p className="text-secondary text-sm">{profile.tagline}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content — spaced below the hero card */}
      <div className="pt-24 sm:pt-28 px-4 pb-12 max-w-md mx-auto space-y-4">
        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card p-3"
        >
          <div className="flex gap-2">
            {mode === "public" ? (
              <a
                href={`/?dj=${effectiveSlug}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: accentColor }}
              >
                <Music className="w-5 h-5" />
                התחילו את המסע
              </a>
            ) : (
              <div
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white opacity-80 cursor-default"
                style={{ background: accentColor }}
              >
                <Music className="w-5 h-5" />
                התחילו את המסע
              </div>
            )}
            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-xl border border-glass text-sm font-medium hover:border-brand-blue/50 transition-all"
              type="button"
              title={copied ? "הועתק" : "שתפו / העתיקו"}
              disabled={mode === "preview"}
            >
              {copied ? "הועתק" : "שיתוף"}
            </button>
          </div>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </motion.div>
        )}

        {!hasAnyContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-sm text-secondary leading-relaxed">
              {mode === "preview"
                ? "הוסיפו תוכן בטופס משמאל כדי לראות איך הדף ייראה."
                : "ה-DJ עדיין לא הוסיף פרטים נוספים — אבל אפשר כבר להתחיל את המסע המוזיקלי."}
            </p>
          </motion.div>
        )}

        {/* WhatsApp CTA */}
        {whatsappLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {mode === "public" ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "#25D366" }}
              >
                <MessageCircle className="w-5 h-5" />
                שלחו הודעה בוואטסאפ
              </a>
            ) : (
              <div
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm opacity-80 cursor-default"
                style={{ background: "#25D366" }}
              >
                <MessageCircle className="w-5 h-5" />
                שלחו הודעה בוואטסאפ
              </div>
            )}
          </motion.div>
        )}

        {/* Social Links */}
        {activeSocials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-bold mb-3 text-center">עקבו אחריי</h3>
            <div className="grid grid-cols-3 gap-3">
              {activeSocials.map((social) => {
                const isPrimary = social.key === "spotifyUrl" || social.key === "soundcloudUrl";
                const Wrapper = mode === "public" ? "a" : "div";
                const linkProps = mode === "public" ? {
                  href: profile[social.key],
                  target: "_blank" as const,
                  rel: "noopener noreferrer",
                } : {};
                return (
                  <Wrapper
                    key={social.key}
                    {...linkProps}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isPrimary
                        ? "border-transparent shadow-sm"
                        : "border-glass"
                      } ${mode === "public" ? "hover:scale-105 active:scale-95 cursor-pointer" : ""}`}
                    style={isPrimary ? { background: `${social.color}12`, borderColor: `${social.color}30` } : undefined}
                  >
                    <span
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                      style={{ color: social.color, background: `${social.color}15` }}
                    >
                      {social.icon}
                    </span>
                    <span className="text-xs text-secondary font-medium">{social.label}</span>
                  </Wrapper>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Gallery / Portfolio */}
        {galleryPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-4 space-y-3"
          >
            <h3 className="text-sm font-bold text-center">תיק עבודות</h3>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryPhotos[galleryIndex % galleryPhotos.length]}
                alt={`gallery ${galleryIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => setLightboxOpen(true)}
              />
              {/* Lightbox trigger */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title="הגדל תמונה"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {galleryPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex((prev: number) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGalleryIndex((prev: number) => (prev + 1) % galleryPhotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {galleryPhotos.map((_: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex % galleryPhotos.length ? "bg-white scale-125" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {galleryPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {galleryPhotos.map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === galleryIndex % galleryPhotos.length
                      ? "border-brand-blue scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Lightbox */}
        {lightboxOpen && galleryPhotos.length > 0 && (
          <Lightbox
            images={galleryPhotos}
            currentIndex={galleryIndex % galleryPhotos.length}
            onClose={() => setLightboxOpen(false)}
            onNavigate={(i) => setGalleryIndex(i)}
          />
        )}

        {/* Custom Links */}
        {customLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="space-y-2"
          >
            {customLinks.filter((l: { label: string; url: string }) => l.label && l.url).map((link: { label: string; url: string }, i: number) => (
              mode === "public" ? (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-glass text-sm font-medium hover:border-brand-blue/50 transition-all hover:scale-[1.01]"
                >
                  <Link2 className="w-4 h-4" />
                  {link.label}
                  <ExternalLink className="w-3 h-3 text-muted" />
                </a>
              ) : (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-glass text-sm font-medium"
                >
                  <Link2 className="w-4 h-4" />
                  {link.label}
                  <ExternalLink className="w-3 h-3 text-muted" />
                </div>
              )
            ))}
          </motion.div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-center">מה אומרים עליי</h3>
            {reviews.filter((r: { name: string; text: string; rating: number }) => r.text).map((review: { name: string; text: string; rating: number }, i: number) => (
              <div key={i} className="p-3 rounded-xl border border-glass space-y-1.5">
                <div className="flex items-center gap-2">
                  {review.name && <span className="text-sm font-medium">{review.name}</span>}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3 h-3 ${star <= (review.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-secondary leading-relaxed">{review.text}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Powered by */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <a
            href="/"
            className="text-xs text-muted hover:text-secondary transition-colors inline-flex items-center gap-1"
          >
            Powered by <span className="font-semibold">Compakt</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
