/**
 * Splits liked/super-liked songs into event moment buckets
 * and identifies what's missing for a complete musical picture.
 */

import type { Song, SongSwipe, SongCategory } from "@/lib/types";

export interface MomentBucket {
  key: SongCategory;
  label: string;
  songs: Song[];
  hasMustPlay: boolean;
}

export interface MomentGap {
  key: string;
  message: string;
}

export interface EventMomentsResult {
  buckets: MomentBucket[];
  gaps: MomentGap[];
}

const MOMENT_LABELS: Record<SongCategory, string> = {
  ceremony: "טקס / רגעי רגש",
  reception: "קבלת פנים",
  food: "מוזיקת רקע / אוכל",
  dancing: "רחבה / ריקודים",
};

const MOMENT_ORDER: SongCategory[] = ["ceremony", "reception", "food", "dancing"];

export function buildEventMoments(
  swipes: SongSwipe[],
  songMap: Map<string, Song>,
): EventMomentsResult {
  const positiveSwipes = swipes.filter(
    (s) => s.action === "like" || s.action === "super_like",
  );

  const bucketMap = new Map<SongCategory, { songs: Song[]; hasMustPlay: boolean }>();
  for (const cat of MOMENT_ORDER) {
    bucketMap.set(cat, { songs: [], hasMustPlay: false });
  }

  for (const swipe of positiveSwipes) {
    const song = songMap.get(swipe.songId);
    if (!song) continue;
    const cat = song.category as SongCategory;
    const bucket = bucketMap.get(cat);
    if (!bucket) continue;
    bucket.songs.push(song);
    if (swipe.action === "super_like") bucket.hasMustPlay = true;
  }

  const buckets: MomentBucket[] = MOMENT_ORDER.map((key) => {
    const data = bucketMap.get(key)!;
    return {
      key,
      label: MOMENT_LABELS[key],
      songs: data.songs,
      hasMustPlay: data.hasMustPlay,
    };
  }).filter((b) => b.songs.length > 0);

  // Identify gaps
  const gaps: MomentGap[] = [];
  const hasCeremony = (bucketMap.get("ceremony")?.songs.length || 0) > 0;
  const hasDancing = (bucketMap.get("dancing")?.songs.length || 0) > 0;
  const hasReception = (bucketMap.get("reception")?.songs.length || 0) > 0;
  const hasFood = (bucketMap.get("food")?.songs.length || 0) > 0;

  if (!hasCeremony && positiveSwipes.length >= 5) {
    gaps.push({
      key: "no_ceremony",
      message: "לא נבחרו שירי טקס — שווה לשאול את הזוג אם יש העדפה לכניסה, ריקוד ראשון או שבירת כוס",
    });
  }

  if (!hasDancing && positiveSwipes.length >= 5) {
    gaps.push({
      key: "no_dancing",
      message: "אין שירי רחבה שנבחרו — כדאי לברר עם הזוג מה הסגנון המועדף לריקודים",
    });
  }

  if (hasDancing && !hasReception && !hasFood && positiveSwipes.length >= 8) {
    gaps.push({
      key: "only_dancing",
      message: "רוב השירים שנבחרו הם לרחבה — שקלו להוסיף שירים לקבלת פנים ומוזיקת רקע",
    });
  }

  const superLikeCount = swipes.filter((s) => s.action === "super_like").length;
  if (superLikeCount === 0 && positiveSwipes.length >= 5) {
    gaps.push({
      key: "no_must_play",
      message: "אין שירי חובה — שווה לשאול את הזוג אם יש שיר שחייב להישמע",
    });
  }

  return { buckets, gaps };
}
