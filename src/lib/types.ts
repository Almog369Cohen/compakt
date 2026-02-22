export type EventType = "wedding" | "bar_mitzvah" | "private" | "corporate" | "other";

export type QuestionType = "single_select" | "multi_select" | "slider" | "text";

export type SwipeAction = "like" | "dislike" | "super_like" | "unsure";

export type SongCategory = "reception" | "food" | "dancing" | "ceremony";

export type RequestType = "free_text" | "do" | "dont" | "link" | "special_moment";

export type MomentType = "ceremony" | "glass_break" | "first_dance" | "entrance" | "parents" | "other";

export type ThemeMode = "night" | "day";

export interface EventData {
  id: string;
  magicToken: string;
  eventType: EventType;
  eventDate?: string;
  venue?: string;
  city?: string;
  coupleNameA?: string;
  coupleNameB?: string;
  currentStage: number;
  theme: ThemeMode;
  createdAt: string;
}

export interface QuestionOption {
  label: string;
  value: string;
  icon?: string;
}

export interface Question {
  id: string;
  eventType: EventType;
  sortOrder: number;
  questionHe: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  sliderMin?: number;
  sliderMax?: number;
  sliderLabels?: string[];
  isActive: boolean;
}

export interface QuestionAnswer {
  id: string;
  eventId: string;
  questionId: string;
  answerValue: string | string[] | number;
  answeredAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl?: string;
  externalLink?: string;
  category: SongCategory;
  tags: string[];
  energy: number;
  decade?: string;
  language: string;
  isSafe: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface SongSwipe {
  id: string;
  eventId: string;
  songId: string;
  action: SwipeAction;
  reasonChips: string[];
  swipedAt: string;
}

export interface EventRequest {
  id: string;
  eventId: string;
  requestType: RequestType;
  content: string;
  momentType?: MomentType;
  createdAt: string;
}

export interface Upsell {
  id: string;
  titleHe: string;
  descriptionHe: string;
  priceHint?: string;
  ctaTextHe: string;
  imageUrl?: string;
  placement: "stage_4" | "post_brief" | "inline";
  sortOrder: number;
  isActive: boolean;
}

export interface UpsellClick {
  id: string;
  eventId: string;
  upsellId: string;
  clickedAt: string;
}

export interface MusicBrief {
  event: EventData;
  answers: QuestionAnswer[];
  questions: Question[];
  swipes: SongSwipe[];
  songs: Song[];
  requests: EventRequest[];
  likedSongs: Song[];
  superLikedSongs: Song[];
  dislikedSongs: Song[];
  redLines: string[];
  crowdNotes: string[];
}
