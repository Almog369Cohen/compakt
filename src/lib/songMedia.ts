export type SongMediaType = "youtube" | "audio_file" | "spotify" | "external_only" | "none";

export type ResolvedSongMedia = {
  type: SongMediaType;
  inlineUrl: string;
  externalUrl: string;
  youtubeId: string | null;
  canPlayInline: boolean;
  canAutoFillFromYoutube: boolean;
  sourceLabel: string;
  helperText: string;
};

function normalizeUrl(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function getYouTubeId(url?: string | null) {
  const value = normalizeUrl(url);
  if (!value) return null;

  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

export function isSpotifyUrl(url?: string | null) {
  const value = normalizeUrl(url).toLowerCase();
  return value.includes("open.spotify.com/") || value.includes("spotify.link/");
}

export function isAudioFileUrl(url?: string | null) {
  const value = normalizeUrl(url).toLowerCase();
  if (!value) return false;
  return /\.(mp3|wav|m4a|aac|ogg|oga|flac)(\?|#|$)/i.test(value);
}

export function resolveSongMedia(previewUrl?: string | null, externalLink?: string | null): ResolvedSongMedia {
  const preview = normalizeUrl(previewUrl);
  const external = normalizeUrl(externalLink);

  const previewYoutubeId = getYouTubeId(preview);
  if (previewYoutubeId) {
    return {
      type: "youtube",
      inlineUrl: preview,
      externalUrl: external || preview,
      youtubeId: previewYoutubeId,
      canPlayInline: true,
      canAutoFillFromYoutube: true,
      sourceLabel: "YouTube",
      helperText: "הנגן ישתמש בפריוויו YouTube מתוך השדה של פריוויו.",
    };
  }

  if (isAudioFileUrl(preview)) {
    return {
      type: "audio_file",
      inlineUrl: preview,
      externalUrl: external,
      youtubeId: null,
      canPlayInline: true,
      canAutoFillFromYoutube: false,
      sourceLabel: "קובץ אודיו",
      helperText: "הנגן ישתמש בקובץ האודיו שהועלה או הודבק בשדה הפריוויו.",
    };
  }

  const externalYoutubeId = getYouTubeId(external);
  if (externalYoutubeId) {
    return {
      type: "youtube",
      inlineUrl: external,
      externalUrl: external,
      youtubeId: externalYoutubeId,
      canPlayInline: true,
      canAutoFillFromYoutube: true,
      sourceLabel: "YouTube מלינק חיצוני",
      helperText: "לא הוגדר פריוויו נפרד, לכן הנגן ישתמש אוטומטית בלינק YouTube החיצוני.",
    };
  }

  if (isAudioFileUrl(external)) {
    return {
      type: "audio_file",
      inlineUrl: external,
      externalUrl: external,
      youtubeId: null,
      canPlayInline: true,
      canAutoFillFromYoutube: false,
      sourceLabel: "קובץ אודיו מלינק חיצוני",
      helperText: "לא הוגדר פריוויו נפרד, לכן הנגן ישתמש בקובץ האודיו מהלינק החיצוני.",
    };
  }

  if (isSpotifyUrl(external)) {
    return {
      type: "spotify",
      inlineUrl: "",
      externalUrl: external,
      youtubeId: null,
      canPlayInline: false,
      canAutoFillFromYoutube: false,
      sourceLabel: "Spotify",
      helperText: "הלינק ייפתח חיצונית. Spotify לא נתמך כנגן פנימי כרגע.",
    };
  }

  if (external) {
    return {
      type: "external_only",
      inlineUrl: "",
      externalUrl: external,
      youtubeId: null,
      canPlayInline: false,
      canAutoFillFromYoutube: false,
      sourceLabel: "לינק חיצוני בלבד",
      helperText: "הלינק ייפתח חיצונית כי לא זוהה כ-YouTube או כקובץ אודיו ישיר.",
    };
  }

  return {
    type: "none",
    inlineUrl: "",
    externalUrl: "",
    youtubeId: null,
    canPlayInline: false,
    canAutoFillFromYoutube: false,
    sourceLabel: "ללא פריוויו",
    helperText: "אין מקור נגינה לשיר הזה כרגע.",
  };
}
