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
  onClose,
}: {
  songs: Song[];
  onClose: () => void;
}) {
  const active = songs.filter((s) => s.isActive);

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
            <p className="text-xs text-muted">מציג רק שירים פעילים ({active.length})</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {active.map((song) => (
            <div key={song.id} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-gray/30 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.coverUrl}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{song.title}</p>
                  <p className="text-xs text-muted truncate">{song.artist}</p>
                  <p className="text-[10px] text-secondary mt-1">{"⚡".repeat(song.energy)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {active.length === 0 && (
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

  const handleImport = async () => {
    const url = playlistUrl.trim();
    if (!url) return;
    setImporting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/spotify/playlist?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Import failed");
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
      alert(`שגיאה בייבוא Spotify: ${e instanceof Error ? e.message : ""}`);
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
        </div>

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
