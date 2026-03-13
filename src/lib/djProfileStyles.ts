export type DJProfileStyle = "glass_premium" | "editorial_mono";

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
      shortName: "Glass Premium",
      hero: "Hero ממוקד המרה עם CTA מוקדם וסושיאל נגיש",
      structure: "Hero > Actions > Socials > Video > Gallery > Reviews",
    },
    {
      value: "editorial_mono",
      label: "Editorial Mono",
      description: "טיפוגרפיה דומיננטית, מונוכרומטי, מרווח נשימה ותחושת מותג מערכתית",
      preview: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(148,163,184,0.10), rgba(2,6,23,0.98))",
      shortName: "Editorial Mono",
      hero: "Hero טיפוגרפי שקט עם bio מוביל, הוכחה חברתית ו-CTA מינימליסטי",
      structure: "Hero > Bio > Reviews > CTA > Socials > Links > Gallery > Video",
    },
  ];

export const DEFAULT_DJ_PROFILE_STYLE: DJProfileStyle = "glass_premium";

export function isDJProfileStyle(value: unknown): value is DJProfileStyle {
  return DJ_PROFILE_STYLE_OPTIONS.some((option) => option.value === value);
}

export function resolveDJProfileStyleTokens(style: DJProfileStyle) {
  switch (style) {
    case "editorial_mono":
      return {
        pageGradient: "linear-gradient(180deg, rgba(5,8,14,1), rgba(10,12,18,1))",
        frameClass: "rounded-[20px] border border-white/8 bg-transparent shadow-[0_30px_90px_rgba(0,0,0,0.36)]",
        heroLayoutClass: "grid gap-4 lg:grid-cols-[1fr] lg:items-start",
        heroCardClass: "rounded-[20px] border border-white/8 bg-transparent",
        sectionCardClass: "rounded-[18px] border border-white/8 bg-transparent",
        socialCardClass: "rounded-full border border-white/10 bg-transparent hover:bg-white/[0.03]",
        ctaVariant: "inline",
        highlightPillClass: "bg-white/[0.03] border border-white/8 text-white/78",
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
