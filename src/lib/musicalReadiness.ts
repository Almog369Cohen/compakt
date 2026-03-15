/**
 * Musical readiness score for an event.
 * Computes a 0-100 score + individual dimension scores based on event data.
 */

export interface ReadinessInput {
  answerCount: number;
  swipeCount: number;
  requestCount: number;
  superLikeCount: number;
  likeCount: number;
  dislikeCount: number;
  currentStage: number;
  hasDate: boolean;
  hasVenue: boolean;
  hasMomentRequests: boolean;
}

export interface ReadinessDimension {
  label: string;
  score: number;
  maxScore: number;
  status: "empty" | "partial" | "good" | "strong";
  hint: string;
}

export interface ReadinessResult {
  totalScore: number;
  label: string;
  color: string;
  dimensions: ReadinessDimension[];
}

function dimStatus(score: number, max: number): ReadinessDimension["status"] {
  const ratio = max > 0 ? score / max : 0;
  if (ratio === 0) return "empty";
  if (ratio < 0.5) return "partial";
  if (ratio < 0.85) return "good";
  return "strong";
}

export function computeMusicalReadiness(input: ReadinessInput): ReadinessResult {
  const dims: ReadinessDimension[] = [];

  // 1. Questionnaire (max 25)
  const qScore = Math.min(input.answerCount * 5, 25);
  dims.push({
    label: "שאלון",
    score: qScore,
    maxScore: 25,
    status: dimStatus(qScore, 25),
    hint:
      input.answerCount === 0
        ? "הזוג עדיין לא ענו על שאלות"
        : input.answerCount < 3
          ? "יש תשובות חלקיות — שווה לעודד להמשיך"
          : "השאלון מלא מספיק",
  });

  // 2. Song selection (max 35)
  const positiveCount = input.likeCount + input.superLikeCount;
  const songScore = Math.min(positiveCount * 2.5 + input.superLikeCount * 2, 35);
  dims.push({
    label: "בחירת שירים",
    score: Math.round(songScore),
    maxScore: 35,
    status: dimStatus(songScore, 35),
    hint:
      input.swipeCount === 0
        ? "עדיין לא התחילו לסווייפ"
        : input.superLikeCount === 0
          ? "אין שירי חובה — שווה לשאול"
          : `${input.superLikeCount} שירי חובה, ${input.likeCount} אהבו`,
  });

  // 3. Requests & moments (max 20)
  const reqScore = Math.min(
    input.requestCount * 4 + (input.hasMomentRequests ? 8 : 0),
    20,
  );
  dims.push({
    label: "בקשות ורגעים",
    score: reqScore,
    maxScore: 20,
    status: dimStatus(reqScore, 20),
    hint:
      input.requestCount === 0
        ? "אין בקשות מיוחדות עדיין"
        : input.hasMomentRequests
          ? "יש בקשות + רגעים מיוחדים"
          : "יש בקשות, חסרים רגעים מיוחדים",
  });

  // 4. Logistics (max 20)
  let logScore = 0;
  if (input.hasDate) logScore += 10;
  if (input.hasVenue) logScore += 10;
  dims.push({
    label: "לוגיסטיקה",
    score: logScore,
    maxScore: 20,
    status: dimStatus(logScore, 20),
    hint:
      !input.hasDate && !input.hasVenue
        ? "חסרים תאריך ומקום"
        : !input.hasDate
          ? "חסר תאריך אירוע"
          : !input.hasVenue
            ? "חסר מקום אירוע"
            : "תאריך ומקום מוגדרים",
  });

  const totalScore = dims.reduce((sum, d) => sum + d.score, 0);

  let label: string;
  let color: string;
  if (totalScore < 20) {
    label = "טרם התחיל";
    color = "var(--accent-danger)";
  } else if (totalScore < 45) {
    label = "בהתהוות";
    color = "var(--accent-gold)";
  } else if (totalScore < 75) {
    label = "מתקדם";
    color = "var(--accent-secondary)";
  } else {
    label = "מוכן";
    color = "var(--accent-secondary)";
  }

  return { totalScore, label, color, dimensions: dims };
}
