export type DJProfileStyle = "glass_premium" | "editorial_landing" | "club_neon" | "minimal_luxury";

export const DJ_PROFILE_STYLE_OPTIONS: Array<{
  value: DJProfileStyle;
  label: string;
  description: string;
  preview: string;
  shortName: string;
  hero: string;
  structure: string;
}> = [
    {
      value: "glass_premium",
      label: "Glass Premium",
      description: "זכוכית, עומק, glow עדין ותחושת מוצר יוקרה",
      preview: "linear-gradient(135deg, rgba(5,156,192,0.45), rgba(3,178,140,0.2), rgba(15,23,42,0.95))",
      shortName: "Linktree Premium",
      hero: "Hero ממוקד המרה עם CTA מוקדם וסושיאל נגיש",
      structure: "Hero > Actions > Socials > Video > Gallery > Reviews",
    },
    {
      value: "editorial_landing",
      label: "Artist Story",
      description: "עמוד אמן עם hero טקסטואלי חזק, סיפור מותג וכניסה מהירה לפעולה",
      preview: "linear-gradient(135deg, rgba(244,114,182,0.42), rgba(99,102,241,0.18), rgba(15,23,42,0.98))",
      shortName: "Artist Story",
      hero: "Hero מערכתי עם סיפור, bio והוכחה חברתית",
      structure: "Hero Story > Reviews > Video > Gallery > Links",
    },
    {
      value: "club_neon",
      label: "Showcase Rail",
      description: "מבנה שמבליט קטעי וידאו, הופעות ורגעי במה לפני שאר התוכן",
      preview: "linear-gradient(135deg, rgba(34,211,238,0.28), rgba(139,92,246,0.4), rgba(2,6,23,0.98))",
      shortName: "Showcase Media",
      hero: "Hero של showreel עם וידאו ראשון ו-media-first scan",
      structure: "Featured Video > Video Rail > CTA > Gallery > Reviews > Links",
    },
    {
      value: "minimal_luxury",
      label: "Minimal Luxury",
      description: "נקי, אלגנטי, טיפוגרפיה חזקה ופחות רעש חזותי",
      preview: "linear-gradient(135deg, rgba(148,163,184,0.22), rgba(255,255,255,0.08), rgba(15,23,42,0.98))",
      shortName: "Minimal Luxury",
      hero: "Hero שקט, טיפוגרפי ואלגנטי עם מעט רעש",
      structure: "Hero > Bio > CTA > Featured Media > Reviews > Socials",
    },
  ];

export const DEFAULT_DJ_PROFILE_STYLE: DJProfileStyle = "glass_premium";

export function isDJProfileStyle(value: unknown): value is DJProfileStyle {
  return DJ_PROFILE_STYLE_OPTIONS.some((option) => option.value === value);
}

export function resolveDJProfileStyleTokens(style: DJProfileStyle) {
  switch (style) {
    case "editorial_landing":
      return {
        pageGradient: "radial-gradient(circle at top, rgba(244,114,182,0.2), transparent 30%), radial-gradient(circle at 85% 15%, rgba(99,102,241,0.16), transparent 22%), linear-gradient(180deg, rgba(10,14,22,0.98), rgba(7,10,16,1))",
        frameClass: "rounded-[32px] border border-white/10 bg-white/[0.02] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
        heroLayoutClass: "grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end",
        heroCardClass: "rounded-[32px] border border-white/8 bg-transparent shadow-[0_18px_60px_rgba(0,0,0,0.3)]",
        sectionCardClass: "rounded-[28px] border border-white/8 bg-white/[0.03] backdrop-blur-md",
        socialCardClass: "rounded-2xl border border-white/8 bg-transparent hover:bg-white/[0.04]",
        ctaVariant: "split",
        highlightPillClass: "bg-white/[0.07] border border-white/10 text-white/90",
      };
    case "club_neon":
      return {
        pageGradient: "radial-gradient(circle at top, rgba(34,211,238,0.2), transparent 24%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.2), transparent 25%), linear-gradient(180deg, rgba(3,7,18,1), rgba(8,10,24,1))",
        frameClass: "rounded-[32px] border border-cyan-400/15 bg-black/20 shadow-[0_30px_90px_rgba(8,145,178,0.22)]",
        heroLayoutClass: "grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch",
        heroCardClass: "rounded-[30px] border border-cyan-400/15 bg-black/10 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_60px_rgba(34,211,238,0.16)]",
        sectionCardClass: "rounded-[26px] border border-cyan-400/12 bg-black/10 backdrop-blur-lg",
        socialCardClass: "rounded-2xl border border-cyan-400/15 bg-transparent hover:bg-cyan-400/10",
        ctaVariant: "stacked",
        highlightPillClass: "bg-cyan-400/10 border border-cyan-300/20 text-white",
      };
    case "minimal_luxury":
      return {
        pageGradient: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(17,24,39,1))",
        frameClass: "rounded-[32px] border border-white/6 bg-transparent shadow-[0_24px_70px_rgba(0,0,0,0.32)]",
        heroLayoutClass: "grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center",
        heroCardClass: "rounded-[28px] border border-white/8 bg-transparent",
        sectionCardClass: "rounded-[22px] border border-white/6 bg-transparent",
        socialCardClass: "rounded-2xl border border-white/8 bg-transparent hover:bg-white/[0.03]",
        ctaVariant: "inline",
        highlightPillClass: "bg-white/[0.04] border border-white/8 text-white/85",
      };
    case "glass_premium":
    default:
      return {
        pageGradient: "radial-gradient(circle at top, rgba(5,156,192,0.18), transparent 30%), linear-gradient(180deg, rgba(7,11,18,0.98), rgba(10,14,22,1))",
        frameClass: "rounded-[32px] border border-white/10 bg-white/[0.035] shadow-[0_24px_90px_rgba(0,0,0,0.38)]",
        heroLayoutClass: "grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end",
        heroCardClass: "rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.28)]",
        sectionCardClass: "rounded-[24px] border border-white/10 bg-white/[0.05] backdrop-blur-xl",
        socialCardClass: "rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
        ctaVariant: "inline",
        highlightPillClass: "bg-white/[0.06] border border-white/10 text-white/90",
      };
  }
}
