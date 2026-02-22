"use client";

import { useState } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Eye,
  EyeOff,
  Music,
  Upload,
  Monitor,
  Link as LinkIcon,
  LogIn,
  ListMusic,
  Wand2,
} from "lucide-react";
import type { Song, SongCategory } from "@/lib/types";

const categories: { value: SongCategory; label: string }[] = [
  { value: "reception", label: "קבלת פנים" },
  { value: "food", label: "אוכל" },
  { value: "dancing", label: "רחבה" },
  { value: "ceremony", label: "טקס" },
];

const languages = [
  { value: "hebrew", label: "עברית" },
  { value: "english", label: "אנגלית" },
  { value: "arabic", label: "ערבית" },
  { value: "other", label: "אחר" },
];

export function SongManager() {
  const songs = useAdminStore((s) => s.songs);
  const addSong = useAdminStore((s) => s.addSong);
  const updateSong = useAdminStore((s) => s.updateSong);
  const deleteSong = useAdminStore((s) => s.deleteSong);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);

  const filtered = songs.filter((s) => {
    const matchSearch =
      s.title.includes(search) ||
      s.artist.includes(search) ||
      s.tags.some((t) => t.includes(search));
    const matchCategory =
      filterCategory === "all" || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-brand-blue" />
          ספריית שירים ({songs.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <Monitor className="w-4 h-4" />
            תצוגה מקדימה
          </button>
          <button
            onClick={() => setShowSpotifyImport(true)}
            className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <LinkIcon className="w-4 h-4" />
            Spotify
          </button>
          <a
            href="/songs-template.csv"
            download
            className="text-[10px] text-muted underline hover:text-brand-blue transition-colors"
          >
            תבנית CSV
          </a>
          <label className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4 cursor-pointer">
            <Upload className="w-4 h-4" />
            CSV ייבוא
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target?.result as string;
                  const lines = text.split("\n").filter((l) => l.trim());
                  if (lines.length < 2) return alert("קובץ ריק");
                  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                  const titleIdx = headers.indexOf("title");
                  const artistIdx = headers.indexOf("artist");
                  if (titleIdx === -1 || artistIdx === -1) {
                    return alert("CSV חייב לכלול עמודות title ו-artist");
                  }
                  const tagsIdx = headers.indexOf("tags");
                  const categoryIdx = headers.indexOf("category");
                  const energyIdx = headers.indexOf("energy");
                  const langIdx = headers.indexOf("language");
                  const coverIdx = headers.indexOf("cover");
                  const previewIdx = headers.indexOf("preview");

                  let count = 0;
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map((c) => c.trim());
                    const title = cols[titleIdx];
                    const artist = cols[artistIdx];
                    if (!title || !artist) continue;
                    addSong({
                      title,
                      artist,
                      tags: tagsIdx >= 0 ? cols[tagsIdx]?.split("|").filter(Boolean) || [] : [],
                      category: (categoryIdx >= 0 ? cols[categoryIdx] : "dancing") as SongCategory,
                      energy: energyIdx >= 0 ? Math.min(5, Math.max(1, parseInt(cols[energyIdx]) || 3)) : 3,
                      language: langIdx >= 0 ? cols[langIdx] || "hebrew" : "hebrew",
                      coverUrl: coverIdx >= 0 ? cols[coverIdx] || "" : "",
                      previewUrl: previewIdx >= 0 ? cols[previewIdx] || "" : "",
                      isSafe: true,
                      isActive: true,
                    });
                    count++;
                  }
                  alert(`${count} שירים יובאו בהצלחה!`);
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <Plus className="w-4 h-4" />
            הוסף שיר
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש שיר, אמן או תגית..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterCategory("all")}
            className={`chip text-xs ${filterCategory === "all" ? "active" : ""}`}
          >
            הכל
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilterCategory(c.value)}
              className={`chip text-xs ${filterCategory === c.value ? "active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Songs Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass text-right">
                <th className="px-4 py-3 font-medium text-muted">שיר</th>
                <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">קטגוריה</th>
                <th className="px-4 py-3 font-medium text-muted hidden md:table-cell">תגיות</th>
                <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">אנרגיה</th>
                <th className="px-4 py-3 font-medium text-muted w-24">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((song) => (
                <tr
                  key={song.id}
                  className="border-b border-glass/50 hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-gray/30 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{song.title}</p>
                        <p className="text-xs text-muted truncate">{song.artist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="chip text-xs">
                      {categories.find((c) => c.value === song.category)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {song.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {"⚡".repeat(song.energy)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSong(song.id, { isActive: !song.isActive })}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
                        aria-label={song.isActive ? "הסתר" : "הצג"}
                      >
                        {song.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingSong(song)}
                        className="p-1.5 rounded-lg text-muted hover:text-brand-blue transition-colors"
                        aria-label="ערוך"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("למחוק את השיר?")) deleteSong(song.id);
                        }}
                        className="p-1.5 rounded-lg text-muted hover:text-accent-danger transition-colors"
                        aria-label="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">
            לא נמצאו שירים
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingSong) && (
          <SongModal
            song={editingSong}
            onSave={(data) => {
              if (editingSong) {
                updateSong(editingSong.id, data);
              } else {
                addSong(data as Omit<Song, "id" | "sortOrder">);
              }
              setShowAddModal(false);
              setEditingSong(null);
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditingSong(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreview && (
          <PreviewModal
            songs={songs}
            onToggleActive={(id, isActive) => updateSong(id, { isActive })}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpotifyImport && (
          <SpotifyImportModal
            existingSongs={songs}
            onAdd={(data) => addSong(data)}
            onClose={() => setShowSpotifyImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewModal({
  songs,
  onToggleActive,
  onClose,
}: {
  songs: Song[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [index, setIndex] = useState(0);
  const list = (showAll ? songs : songs.filter((s) => s.isActive)).sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );
  const current = list[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">תצוגה מקדימה (כמו אצל הלקוח)</h3>
            <p className="text-xs text-muted">דק כרטיסים בסגנון Song Tinder</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => {
              setShowAll((v) => !v);
              setIndex(0);
            }}
            className={`chip text-xs ${showAll ? "active" : ""}`}
          >
            {showAll ? "כל השירים" : "רק פעילים"}
          </button>
          <div className="text-xs text-muted" dir="ltr">
            {list.length === 0 ? "0 / 0" : `${index + 1} / ${list.length}`}
          </div>
        </div>

        {list.length > 0 && current && (
          <div className="flex items-center justify-center py-2">
            <div className="relative w-full max-w-sm h-[520px]">
              {list
                .slice(index, index + 3)
                .reverse()
                .map((song, i, arr) => {
                  const depth = arr.length - 1 - i;
                  const scale = 1 - depth * 0.035;
                  const y = depth * 10;
                  const opacity = 1 - depth * 0.08;

                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity, y, scale }}
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      className="absolute inset-0 glass-card p-5"
                      style={{
                        borderImage: depth === 0 ? "linear-gradient(135deg, #059cc0, #03b28c) 1" : undefined,
                        borderWidth: depth === 0 ? "1px" : undefined,
                        borderStyle: depth === 0 ? "solid" : undefined,
                      }}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="w-52 h-52 rounded-2xl overflow-hidden shadow-xl mb-5 bg-brand-gray/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <h4 className="text-lg font-bold leading-tight">{song.title}</h4>
                        <p className="text-sm text-secondary mb-2">{song.artist}</p>

                        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                          <span className="chip text-xs">{"⚡".repeat(song.energy)}</span>
                          <span className="chip text-xs">
                            {categories.find((c) => c.value === song.category)?.label}
                          </span>
                          {!song.isSafe && (
                            <span className="chip text-xs" style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}>
                              לא בטוח
                            </span>
                          )}
                        </div>

                        <div className="mt-auto w-full space-y-2">
                          <button
                            onClick={() => onToggleActive(song.id, !song.isActive)}
                            className="btn-secondary w-full text-sm"
                          >
                            {song.isActive ? "הפוך ללא פעיל" : "הפוך לפעיל"}
                          </button>
                          {song.externalLink && (
                            <a
                              href={song.externalLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-blue hover:underline block"
                              dir="ltr"
                            >
                              {song.externalLink}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0 || list.length === 0}
            className={`btn-secondary flex-1 ${index === 0 || list.length === 0 ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            הקודם
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(list.length - 1, i + 1))}
            disabled={list.length === 0 || index >= list.length - 1}
            className={`btn-primary flex-1 ${list.length === 0 || index >= list.length - 1 ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            הבא
          </button>
        </div>

        {list.length === 0 && (
          <div className="text-sm text-muted text-center py-10">
            אין שירים פעילים כרגע
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function SpotifyImportModal({
  existingSongs,
  onAdd,
  onClose,
}: {
  existingSongs: Song[];
  onAdd: (song: Omit<Song, "id" | "sortOrder">) => void;
  onClose: () => void;
}) {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState<
    Array<{ id: string; name: string; tracksTotal: number; imageUrl?: string }>
  >([]);

  const handleImport = async () => {
    const url = playlistUrl.trim();
    if (!url) return;
    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/spotify/playlist?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const text = await res.text();
        const msg = (text || "Import failed").trim();
        if (msg.includes("Missing SPOTIFY_CLIENT_ID")) {
          throw new Error("חסרים מפתחות Spotify ב-Netlify (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)");
        }
        if (msg.includes("Invalid spotify url") || msg.includes("Invalid playlist url")) {
          throw new Error("הלינק לא מזוהה. נסו להדביק לינק של playlist/track מ-open.spotify.com או spotify.link");
        }
        if (msg.includes("No tracks found")) {
          throw new Error("לא נמצאו שירים בלינק הזה");
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        songs: Array<{
          title: string;
          artist: string;
          coverUrl: string;
          externalLink?: string;
        }>;
      };

      let imported = 0;
      let skipped = 0;

      for (const s of data.songs) {
        const already = existingSongs.some(
          (e) =>
            e.title.toLowerCase() === s.title.toLowerCase() &&
            e.artist.toLowerCase() === s.artist.toLowerCase()
        );
        if (already) {
          skipped++;
          continue;
        }

        onAdd({
          title: s.title,
          artist: s.artist,
          tags: ["Spotify"],
          category: "dancing",
          energy: 3,
          language: "other",
          coverUrl: s.coverUrl,
          previewUrl: "",
          externalLink: s.externalLink,
          isSafe: true,
          isActive: true,
        });
        imported++;
      }

      setResult({ imported, skipped });
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setImporting(false);
    }
  };

  const loadPlaylists = async () => {
    setPlaylistsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/me/playlists", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed");
      }
      const data = (await res.json()) as {
        connected: boolean;
        playlists: Array<{ id: string; name: string; tracksTotal: number; imageUrl?: string }>;
      };
      setConnected(!!data.connected);
      setPlaylists(Array.isArray(data.playlists) ? data.playlists : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const importPlaylistById = async (id: string) => {
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/spotify/import/playlist?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        const msg = (text || "Import failed").trim();
        if (res.status === 401) {
          throw new Error("לא מחובר ל-Spotify. לחצו על 'התחבר עם Spotify'");
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        songs: Array<{ title: string; artist: string; coverUrl: string; externalLink?: string }>;
      };

      let imported = 0;
      let skipped = 0;
      for (const s of data.songs) {
        const already = existingSongs.some(
          (song) =>
            song.title.toLowerCase() === s.title.toLowerCase() &&
            song.artist.toLowerCase() === s.artist.toLowerCase()
        );
        if (already) {
          skipped++;
          continue;
        }

        onAdd({
          title: s.title,
          artist: s.artist,
          tags: ["Spotify"],
          category: "dancing",
          energy: 3,
          language: "other",
          coverUrl: s.coverUrl,
          previewUrl: "",
          externalLink: s.externalLink,
          isSafe: true,
          isActive: true,
        });
        imported++;
      }

      setResult({ imported, skipped });
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 w-full max-w-lg space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">ייבוא פלייליסט מ-Spotify</h3>
            <p className="text-xs text-muted">דורש הגדרת משתני סביבה ב-Netlify: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/api/spotify/connect?returnTo=${encodeURIComponent("/admin")}`}
            className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <LogIn className="w-4 h-4" />
            התחבר עם Spotify
          </a>
          <button
            type="button"
            onClick={loadPlaylists}
            className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
            disabled={playlistsLoading}
          >
            <ListMusic className="w-4 h-4" />
            {playlistsLoading ? "טוען..." : "טען פלייליסטים"}
          </button>
          {connected && (
            <span className="text-xs text-brand-green">מחובר</span>
          )}
        </div>

        {playlists.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted">בחר פלייליסט לייבוא (דרך החשבון שלך):</p>
            <div className="max-h-48 overflow-auto space-y-2 pr-1">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => importPlaylistById(p.id)}
                  className="w-full text-right px-3 py-2 rounded-xl border border-glass hover:border-brand-blue/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-gray/30 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.tracksTotal} שירים</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-muted mb-1">לינק פלייליסט</label>
          <input
            type="url"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            dir="ltr"
            placeholder="https://open.spotify.com/playlist/..."
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
          <p className="text-[11px] text-muted mt-2" dir="ltr">
            Examples: open.spotify.com/playlist/... | open.spotify.com/track/... | spotify:playlist:... | spotify.link/...
          </p>
        </div>

        {error && (
          <div className="text-sm p-3 rounded-xl border" style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}>
            {error}
          </div>
        )}

        {result && (
          <div className="text-sm">
            <p className="text-brand-green font-medium">יובאו: {result.imported}</p>
            <p className="text-xs text-muted">דולגו (כבר קיימים): {result.skipped}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !playlistUrl.trim()}
            className={`btn-primary flex-1 ${importing || !playlistUrl.trim() ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {importing ? "מייבא..." : "ייבא"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            סגור
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SongModal({
  song,
  onSave,
  onClose,
}: {
  song: Song | null;
  onSave: (data: Partial<Song>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(song?.title || "");
  const [artist, setArtist] = useState(song?.artist || "");
  const [coverUrl, setCoverUrl] = useState(song?.coverUrl || "");
  const [previewUrl, setPreviewUrl] = useState(song?.previewUrl || "");
  const [externalLink, setExternalLink] = useState(song?.externalLink || "");
  const [category, setCategory] = useState<SongCategory>(song?.category || "dancing");
  const [tags, setTags] = useState(song?.tags.join(", ") || "");
  const [energy, setEnergy] = useState(song?.energy || 3);
  const [language, setLanguage] = useState(song?.language || "hebrew");
  const [isSafe, setIsSafe] = useState(song?.isSafe ?? true);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<"audio" | "cover" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (kind: "audio" | "cover", file: File) => {
    setUploadingKind(kind);
    setUploadError(null);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error((text || "Upload failed").trim());
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) throw new Error("Upload failed");
      if (kind === "cover") setCoverUrl(data.url);
      if (kind === "audio") setPreviewUrl(data.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleAutoFill = async () => {
    const url = previewUrl.trim();
    if (!url) return;
    setMetaLoading(true);
    setMetaError(null);
    try {
      const res = await fetch(`/api/youtube/oembed?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "YouTube lookup failed");
      }
      const data = (await res.json()) as {
        title?: string;
        thumbnailUrl?: string;
      };

      if (data.title && !title.trim()) {
        // naive parse: "Song - Artist" or "Artist - Song"
        const parts = data.title.split("-").map((p) => p.trim());
        if (parts.length >= 2 && !artist.trim()) {
          setArtist(parts[0]);
          setTitle(parts.slice(1).join(" - "));
        } else {
          setTitle(data.title);
        }
      }
      if (data.thumbnailUrl && !coverUrl.trim()) {
        setCoverUrl(data.thumbnailUrl);
      }
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : "שגיאה לא ידועה");
    } finally {
      setMetaLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      artist,
      coverUrl,
      previewUrl: previewUrl || undefined,
      externalLink: externalLink || undefined,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      energy,
      language,
      isSafe,
      isActive: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{song ? "עריכת שיר" : "הוספת שיר"}</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-muted mb-1">שם השיר *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-muted mb-1">אמן *</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">כיסוי (URL)</label>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            dir="ltr"
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
          <div className="flex items-center justify-between mt-2 gap-2">
            <label className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 cursor-pointer ${uploadingKind ? "opacity-60 cursor-not-allowed" : ""}`}>
              <Upload className="w-3.5 h-3.5" />
              {uploadingKind === "cover" ? "מעלה..." : "העלה תמונה"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!!uploadingKind}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  void uploadFile("cover", f);
                }}
              />
            </label>
            {uploadError && (
              <span className="text-[11px]" style={{ color: "var(--accent-danger)" }}>
                {uploadError}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">Audio Preview URL (YouTube / Spotify)</label>
          <input
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            dir="ltr"
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
          <div className="flex items-center justify-between mt-2 gap-2">
            <label className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 cursor-pointer ${uploadingKind ? "opacity-60 cursor-not-allowed" : ""}`}>
              <Upload className="w-3.5 h-3.5" />
              {uploadingKind === "audio" ? "מעלה..." : "העלה אודיו"}
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={!!uploadingKind}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  void uploadFile("audio", f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={metaLoading || !previewUrl.trim()}
              className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 ${metaLoading || !previewUrl.trim() ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {metaLoading ? "ממלא..." : "מלא פרטים מיוטיוב"}
            </button>
            {metaError && (
              <span className="text-[11px]" style={{ color: "var(--accent-danger)" }}>
                {metaError}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">לינק חיצוני (Spotify / YouTube)</label>
          <input
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            dir="ltr"
            placeholder="https://open.spotify.com/track/..."
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SongCategory)}
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">שפה</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">תגיות (מופרדות בפסיק)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="פופ, רחבה, אנרגטי"
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">אנרגיה ({energy}/5)</label>
          <input
            type="range"
            min={1}
            max={5}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-brand-blue"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>רגוע</span>
            <span>{"⚡".repeat(energy)}</span>
            <span>מטורף</span>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isSafe}
            onChange={(e) => setIsSafe(e.target.checked)}
            className="accent-brand-green"
          />
          <span className="text-sm">שיר &quot;בטוח&quot; (מתאים לכל קהל)</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1">
            {song ? "שמור שינויים" : "הוסף שיר"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
