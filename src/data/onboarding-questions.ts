export interface QuickStartQuestion {
  text: string;
  type: "text" | "multiple_choice" | "rating";
  options?: string[];
  isActive: boolean;
  order: number;
}

export const QUICK_START_QUESTIONS: QuickStartQuestion[] = [
  {
    text: "איזה סגנון מוזיקה אתם הכי אוהבים?",
    type: "multiple_choice",
    options: ["ישראלי", "מזרחי", "Pop בינלאומי", "רוק", "אלקטרוני/דאנס", "R&B/Soul", "כל הסגנונות"],
    isActive: true,
    order: 1,
  },
  {
    text: "יש שיר מיוחד שחייב להיות באירוע?",
    type: "text",
    isActive: true,
    order: 2,
  },
  {
    text: "יש שיר שאתם ממש לא רוצים לשמוע?",
    type: "text",
    isActive: true,
    order: 3,
  },
  {
    text: "איזה אנרגיה אתם רוצים באירוע?",
    type: "multiple_choice",
    options: ["מסיבה עם אנרגיה גבוהה", "אלגנטי ורומנטי", "משפחתי ונעים", "מיקס של הכל"],
    isActive: true,
    order: 4,
  },
  {
    text: "יש רגע מיוחד שצריך מוזיקה ספציפית? (כניסה, ריקוד ראשון, וכו')",
    type: "text",
    isActive: true,
    order: 5,
  },
  {
    text: "מה הגיל הממוצע של האורחים?",
    type: "multiple_choice",
    options: ["20-30", "30-40", "40-50", "50+", "מעורב - כל הגילאים"],
    isActive: true,
    order: 6,
  },
  {
    text: "יש להקה או אמן שאתם במיוחד אוהבים?",
    type: "text",
    isActive: true,
    order: 7,
  },
  {
    text: "משהו נוסף שחשוב לנו לדעת על טעם המוזיקה שלכם?",
    type: "text",
    isActive: true,
    order: 8,
  },
];

export const QUICK_START_QUESTIONS_COUNT = QUICK_START_QUESTIONS.length;
