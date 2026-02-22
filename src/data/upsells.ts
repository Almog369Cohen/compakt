import type { Upsell } from "@/lib/types";

export const defaultUpsells: Upsell[] = [
  {
    id: "u1",
    titleHe: "רוצים רגע כניסה מדויק?",
    descriptionHe: "עיבוד אישי לשיר הכניסה שלכם — מותאם בדיוק לרגע, עם תזמון מושלם",
    priceHint: "החל מ-₪800",
    ctaTextHe: "לפרטים",
    placement: "stage_4",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "u2",
    titleHe: "תאורה סינכרונית למוזיקה",
    descriptionHe: "מערכת תאורה שמגיבה בזמן אמת לקצב המוזיקה — אפקטים מדויקים שמעלים את האווירה לרמה אחרת",
    priceHint: "החל מ-₪1,500",
    ctaTextHe: "ספרו לי עוד",
    placement: "stage_4",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "u3",
    titleHe: "חבילת רגעים מיוחדים",
    descriptionHe: "תכנון מוזיקלי מלא לחופה, כניסה, ריקוד ראשון והורים — כל רגע עם הסאונדטרק המושלם",
    priceHint: "החל מ-₪1,200",
    ctaTextHe: "אני רוצה",
    placement: "stage_4",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "u4",
    titleHe: "מאשאפ אישי",
    descriptionHe: "שילוב ייחודי של שני שירים שאתם אוהבים לרגע אחד בלתי נשכח",
    priceHint: "החל מ-₪600",
    ctaTextHe: "מעניין אותי",
    placement: "post_brief",
    sortOrder: 4,
    isActive: true,
  },
];
