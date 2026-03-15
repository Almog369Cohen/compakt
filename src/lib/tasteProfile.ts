import type { Song, SongSwipe } from "@/lib/types";

export interface TasteInsight {
  headline: string;
  traits: string[];
  energyLabel: string;
  confidence: number;
}

const LANG_LABELS: Record<string, string> = {
  hebrew: "ישראלי",
  english: "לועזי",
  other: "בינלאומי",
};

const ENERGY_LABELS: { min: number; max: number; label: string }[] = [
  { min: 0, max: 2.2, label: "אווירה רגועה" },
  { min: 2.2, max: 3.5, label: "אנרגיה מאוזנת" },
  { min: 3.5, max: 5.1, label: "אנרגיה גבוהה" },
];

function topEntries(counts: Map<string, number>, n: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}

function getEnergyLabel(avg: number): string {
  return ENERGY_LABELS.find((e) => avg >= e.min && avg < e.max)?.label ?? "מיקס אנרגיות";
}

function buildHeadline(
  topTags: string[],
  langLabel: string | null,
  energyLabel: string,
  hasNostalgia: boolean,
): string {
  const parts: string[] = [];

  if (langLabel) parts.push(langLabel);
  if (topTags.length > 0) parts.push(topTags[0]);
  if (hasNostalgia) parts.push("נוסטלגיה");
  if (parts.length === 0) parts.push(energyLabel);

  const joined = parts.slice(0, 3).join(" + ");
  return `נראה שאתם הולכים על ${joined}`;
}

export function buildTasteInsight(
  swipes: SongSwipe[],
  songMap: Map<string, Song>,
): TasteInsight | null {
  const positiveSwipes = swipes.filter(
    (s) => s.action === "like" || s.action === "super_like",
  );

  if (positiveSwipes.length < 2) return null;

  const positiveSongs = positiveSwipes
    .map((s) => songMap.get(s.songId))
    .filter(Boolean) as Song[];

  if (positiveSongs.length < 2) return null;

  const tagCounts = new Map<string, number>();
  const langCounts = new Map<string, number>();
  const decadeCounts = new Map<string, number>();

  for (const song of positiveSongs) {
    for (const tag of song.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    langCounts.set(song.language, (langCounts.get(song.language) || 0) + 1);
    if (song.decade) {
      decadeCounts.set(song.decade, (decadeCounts.get(song.decade) || 0) + 1);
    }
  }

  const avgEnergy =
    positiveSongs.reduce((sum, s) => sum + s.energy, 0) / positiveSongs.length;

  const energyLabel = getEnergyLabel(avgEnergy);

  const topTags = topEntries(tagCounts, 3);

  const hebrewRatio =
    (langCounts.get("hebrew") || 0) / positiveSongs.length;
  const langLabel =
    hebrewRatio > 0.65
      ? LANG_LABELS.hebrew
      : hebrewRatio < 0.35
        ? LANG_LABELS.english
        : null;

  const topDecades = topEntries(decadeCounts, 1);
  const hasNostalgia =
    topDecades.length > 0 && (topDecades[0] === "90s" || topDecades[0] === "2000s");

  const traits: string[] = [];
  traits.push(energyLabel);
  if (langLabel) traits.push(langLabel);
  for (const tag of topTags) {
    if (!traits.includes(tag) && traits.length < 5) {
      traits.push(tag);
    }
  }
  if (hasNostalgia && !traits.includes("נוסטלגי") && traits.length < 5) {
    traits.push("נוסטלגי");
  }

  const headline = buildHeadline(topTags, langLabel, energyLabel, hasNostalgia);

  const confidence = Math.min(positiveSwipes.length / 8, 1);

  return { headline, traits, energyLabel, confidence };
}
