"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { useProfileStore } from "@/stores/profileStore";
import Image from "next/image";
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
  CheckSquare,
  Square,
  Save,
} from "lucide-react";
import type { Song, SongCategory } from "@/lib/types";
import type { FeatureKey } from "@/lib/access";
import { resolveSongMedia } from "@/lib/songMedia";
import {
  getSongCategoryOptions,
  DEFAULT_SONG_CATEGORY_LABELS,
  type SongCategoryLabels,
} from "@/lib/songCategories";
import { useTranslation } from "@/lib/i18n";

type AdminAccess = {
  isActive: boolean;
  features: Record<FeatureKey, boolean>;
};


export function SongManager() {
  const { t } = useTranslation("admin");
  const songs = useAdminStore((s) => s.songs);
  const addSong = useAdminStore((s) => s.addSong);
  const updateSong = useAdminStore((s) => s.updateSong);
  const deleteSong = useAdminStore((s) => s.deleteSong);
  const userId = useAdminStore((s) => s.userId);
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const saveProfileToDB = useProfileStore((s) => s.saveProfileToDB);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<SongCategory>("dancing");
  const [savingCategoryLabels, setSavingCategoryLabels] = useState(false);
  const [categoryLabelsSaved, setCategoryLabelsSaved] = useState(false);
  const [categoryLabelsError, setCategoryLabelsError] = useState<string | null>(null);
  const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);
  const [songMutationError, setSongMutationError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSongIds((current) => current.filter((id) => songs.some((song) => song.id === id)));
  }, [songs]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/access", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAccess(data.access || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canUseSpotifyImport = Boolean(access?.isActive && access?.features?.spotify_import);
  const songCategoryLabels = profile.songCategoryLabels || DEFAULT_SONG_CATEGORY_LABELS;
  const categories = useMemo(
    () => getSongCategoryOptions(songCategoryLabels),
    [songCategoryLabels]
  );

  const languages = useMemo(() => [
    { value: "hebrew", label: t("songs.languages.hebrew") },
    { value: "english", label: t("songs.languages.english") },
    { value: "arabic", label: t("songs.languages.arabic") },
    { value: "other", label: t("songs.languages.other") },
  ], [t]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return songs
      .filter((s) => {
        const matchSearch =
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q));
        const matchCategory =
          filterCategory === "all" || s.category === filterCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? -1 : 1;
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [songs, search, filterCategory]);

  const selectedCount = selectedSongIds.length;
  const allFilteredSelected = filtered.length > 0 && filtered.every((song) => selectedSongIds.includes(song.id));

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedSongIds((current) => current.filter((id) => !filtered.some((song) => song.id === id)));
      return;
    }
    setSelectedSongIds((current) => Array.from(new Set([...current, ...filtered.map((song) => song.id)])));
  };

  const showBulkFeedback = (message: string) => {
    setSongMutationError(null);
    setBulkActionMessage(message);
    window.setTimeout(() => {
      setBulkActionMessage((current) => (current === message ? null : current));
    }, 2200);
  };

  const runBulkUpdate = async (patch: Partial<Song>, successMessage: string) => {
    if (selectedSongIds.length === 0) return;
    setSongMutationError(null);
    const results = await Promise.allSettled(
      selectedSongIds.map((songId) => updateSong(songId, patch))
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      setSongMutationError(
        failed[0].reason instanceof Error ? failed[0].reason.message : t("songs.errors.updateFailed")
      );
      return;
    }
    setSelectedSongIds([]);
    showBulkFeedback(successMessage);
  };

  const runBulkDelete = async () => {
    if (selectedSongIds.length === 0) return;
    if (!confirm(t("songs.bulk.deleteConfirm", { count: String(selectedSongIds.length) }))) return;
    setSongMutationError(null);
    const results = await Promise.allSettled(
      selectedSongIds.map((songId) => deleteSong(songId))
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      setSongMutationError(
        failed[0].reason instanceof Error ? failed[0].reason.message : t("songs.errors.deleteFailed")
      );
      return;
    }
    setSelectedSongIds([]);
    showBulkFeedback(t("songs.success.deleted"));
  };

  const handleSaveCategoryLabels = async () => {
    setCategoryLabelsError(null);
    setSavingCategoryLabels(true);
    try {
      await saveProfileToDB(userId || "legacy");
      setCategoryLabelsSaved(true);
      setTimeout(() => setCategoryLabelsSaved(false), 1500);
    } catch (e) {
      setCategoryLabelsError(e instanceof Error ? e.message : t("songs.errors.categoryLabelsFailed"));
    } finally {
      setSavingCategoryLabels(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] p-4 md:p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-secondary">
              <Music className="w-3.5 h-3.5 text-brand-blue" />
              {t("songs.title")}
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("songs.subtitle", { count: String(songs.length) })}</h2>
              <p className="text-sm text-secondary mt-1 max-w-3xl leading-6">
                {t("songs.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPreview(true)}
              className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
            >
              <Monitor className="w-4 h-4" />
              {t("songs.actions.preview")}
            </button>
            <button
              onClick={() => canUseSpotifyImport && setShowSpotifyImport(true)}
              disabled={!canUseSpotifyImport}
              className={`btn-secondary text-sm flex items-center gap-1.5 py-2 px-4 ${!canUseSpotifyImport ? "opacity-50 cursor-not-allowed" : ""}`}
              title={canUseSpotifyImport ? t("songs.actions.spotifyImport") : t("songs.actions.spotifyImportDisabled")}
            >
              <LinkIcon className="w-4 h-4" />
              Spotify
            </button>
            <a
              href="/songs-template.csv"
              download
              className="text-[10px] text-muted underline hover:text-brand-blue transition-colors"
            >
              {t("songs.actions.csvTemplate")}
            </a>
            <label className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4 cursor-pointer">
              <Upload className="w-4 h-4" />
              {t("songs.actions.csvImport")}
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
                    if (lines.length < 2) return alert(t("songs.errors.emptyFile"));
                    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                    const titleIdx = headers.indexOf("title");
                    const artistIdx = headers.indexOf("artist");
                    if (titleIdx === -1 || artistIdx === -1) {
                      return alert(t("songs.errors.invalidCsv"));
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
                      void addSong({
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
                      }).catch((error) => {
                        setSongMutationError(
                          error instanceof Error ? error.message : t("songs.errors.createFailed")
                        );
                      });
                      count++;
                    }
                    alert(t("songs.success.imported", { count: String(count) }));
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
              {t("songs.actions.addSong")}
            </button>
          </div>
        </div>

        {!canUseSpotifyImport && (
          <div className="glass-card p-3 text-sm text-muted">
            {t("songs.spotifyNotAvailable")}
          </div>
        )}

        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold">{t("songs.categoryLabels.title")}</h3>
            <button
              type="button"
              onClick={handleSaveCategoryLabels}
              disabled={savingCategoryLabels}
              className={`btn-secondary text-sm flex items-center gap-2 py-2 px-4 ${savingCategoryLabels ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Save className="w-4 h-4" />
              {savingCategoryLabels ? t("songs.categoryLabels.saving") : categoryLabelsSaved ? t("songs.categoryLabels.saved") : t("songs.categoryLabels.save")}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {categories.map((category) => (
              <div key={category.value}>
                <label className="block text-xs text-muted mb-1">
                  {t(`songs.categoryLabels.${category.value}`)}
                </label>
                <input
                  type="text"
                  value={songCategoryLabels[category.value]}
                  onChange={(e) =>
                    setProfile({
                      songCategoryLabels: {
                        ...songCategoryLabels,
                        [category.value]: e.target.value,
                      } as SongCategoryLabels,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            ))}
          </div>
          {categoryLabelsError && (
            <div className="text-xs" style={{ color: "var(--accent-danger)" }}>
              {categoryLabelsError}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("songs.search.placeholder")}
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterCategory("all")}
              className={`chip text-xs ${filterCategory === "all" ? "active" : ""}`}
            >
              {t("songs.search.all")}
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

        {selectedCount > 0 && (
          <div className="glass-card p-4 flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium ml-2">{t("songs.bulk.selected", { count: String(selectedCount) })}</div>
            <button
              type="button"
              onClick={() => runBulkUpdate({ isActive: false }, t("songs.bulk.deactivate"))}
              className="btn-secondary text-sm py-2 px-3"
            >
              {t("songs.bulk.deactivate")}
            </button>
            <button
              type="button"
              onClick={() => runBulkUpdate({ isActive: true }, t("songs.bulk.activate"))}
              className="btn-secondary text-sm py-2 px-3"
            >
              {t("songs.bulk.activate")}
            </button>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value as SongCategory)}
              className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                runBulkUpdate(
                  { category: bulkCategory },
                  t("songs.bulk.categoryChanged", { category: categories.find((category) => category.value === bulkCategory)?.label || "" })
                )
              }
              className="btn-secondary text-sm py-2 px-3"
            >
              {t("songs.bulk.changeCategory")}
            </button>
            <button
              type="button"
              onClick={runBulkDelete}
              className="btn-secondary text-sm py-2 px-3"
              style={{ color: "var(--accent-danger)" }}
            >
              {t("songs.bulk.delete")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedSongIds([])}
              className="text-xs text-muted hover:text-foreground transition-colors mr-auto"
            >
              {t("songs.bulk.clearSelection")}
            </button>
          </div>
        )}

        {bulkActionMessage && (
          <div className="glass-card p-3 text-sm text-brand-blue">
            {bulkActionMessage}
          </div>
        )}

        {songMutationError && (
          <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
            {songMutationError}
          </div>
        )}

        {/* Songs Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass text-right">
                  <th className="px-4 py-3 font-medium text-muted w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="text-muted hover:text-foreground transition-colors"
                      aria-label={allFilteredSelected ? t("songs.table.deselectAll") : t("songs.table.selectAll")}
                    >
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-muted">{t("songs.table.song")}</th>
                  <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">{t("songs.table.category")}</th>
                  <th className="px-4 py-3 font-medium text-muted hidden md:table-cell">{t("songs.table.tags")}</th>
                  <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">{t("songs.table.energy")}</th>
                  <th className="px-4 py-3 font-medium text-muted w-24">{t("songs.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((song) => (
                  <tr
                    key={song.id}
                    className={`border-b border-glass/50 hover:bg-surface-hover transition-colors ${!song.isActive ? "opacity-55" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSongSelection(song.id)}
                        className="text-muted hover:text-foreground transition-colors"
                        aria-label={selectedSongIds.includes(song.id) ? t("songs.table.deselect") : t("songs.table.select")}
                      >
                        {selectedSongIds.includes(song.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
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
                          onClick={async () => {
                            setSongMutationError(null);
                            try {
                              await updateSong(song.id, { isActive: !song.isActive });
                            } catch (error) {
                              setSongMutationError(
                                error instanceof Error ? error.message : t("songs.errors.updateFailed")
                              );
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${song.isActive ? "text-brand-blue hover:text-brand-blue/80" : "text-accent-danger hover:text-accent-danger/80"}`}
                          aria-label={song.isActive ? t("songs.table.hide") : t("songs.table.show")}
                          title={song.isActive ? t("songs.table.hideSong") : t("songs.table.showSong")}
                        >
                          {song.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingSong(song)}
                          className="p-1.5 rounded-lg text-muted hover:text-brand-blue transition-colors"
                          aria-label={t("songs.table.edit")}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(t("songs.table.deleteSongConfirm"))) return;
                            setSongMutationError(null);
                            try {
                              await deleteSong(song.id);
                            } catch (error) {
                              setSongMutationError(
                                error instanceof Error ? error.message : t("songs.errors.deleteFailed")
                              );
                            }
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-accent-danger transition-colors"
                          aria-label={t("songs.table.delete")}
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
            <div className="p-8 text-center text-muted text-sm space-y-2">
              <p>{songs.length === 0 ? t("songs.empty.noSongs") : t("songs.empty.noResults")}</p>
              <p className="text-xs text-secondary">
                {songs.length === 0
                  ? t("songs.empty.noSongsDetail")
                  : t("songs.empty.noResultsDetail")}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {(showAddModal || editingSong) && (
            <SongModal
              song={editingSong}
              categories={categories}
              languages={languages}
              onSave={async (data) => {
                setSongMutationError(null);
                if (editingSong) {
                  try {
                    await updateSong(editingSong.id, data);
                  } catch (error) {
                    setSongMutationError(
                      error instanceof Error ? error.message : t("songs.errors.updateFailed")
                    );
                    throw error;
                  }
                } else {
                  try {
                    await addSong(data as Omit<Song, "id" | "sortOrder">);
                  } catch (error) {
                    setSongMutationError(
                      error instanceof Error ? error.message : t("songs.errors.createFailed")
                    );
                    throw error;
                  }
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
              categories={categories}
              onToggleActive={(id, isActive) => {
                void updateSong(id, { isActive }).catch((error) => {
                  setSongMutationError(
                    error instanceof Error ? error.message : "עדכון השיר נכשל"
                  );
                });
              }}
              onClose={() => setShowPreview(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSpotifyImport && (
            <SpotifyImportModal
              existingSongs={songs}
              onAdd={(data) => {
                void addSong(data).catch((error) => {
                  setSongMutationError(
                    error instanceof Error ? error.message : "יצירת השיר נכשלה"
                  );
                });
              }}
              onClose={() => setShowSpotifyImport(false)}
              canUseSpotifyImport={canUseSpotifyImport}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PreviewModal({
  songs,
  categories,
  onToggleActive,
  onClose,
}: {
  songs: Song[];
  categories: { value: SongCategory; label: string }[];
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
                  const media = resolveSongMedia(song.previewUrl, song.externalLink);

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
                          <span className="chip text-xs">{media.sourceLabel}</span>
                          {!song.isSafe && (
                            <span className="chip text-xs" style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}>
                              לא בטוח
                            </span>
                          )}
                        </div>

                        <div className="mt-auto w-full space-y-2">
                          <div className="text-[11px] text-muted min-h-[32px]">{media.helperText}</div>
                          <button
                            onClick={() => onToggleActive(song.id, !song.isActive)}
                            className="btn-secondary w-full text-sm"
                          >
                            {song.isActive ? "הפוך ללא פעיל" : "הפוך לפעיל"}
                          </button>
                          {media.externalUrl && (
                            <a
                              href={media.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-blue hover:underline block"
                              dir="ltr"
                            >
                              {media.externalUrl}
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
  canUseSpotifyImport,
}: {
  existingSongs: Song[];
  onAdd: (song: Omit<Song, "id" | "sortOrder">) => void;
  onClose: () => void;
  canUseSpotifyImport: boolean;
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
    if (!canUseSpotifyImport) {
      setError("ייבוא מ-Spotify לא זמין לחשבון הזה");
      return;
    }

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
        if (msg.includes("Feature not enabled for this account")) {
          throw new Error("ייבוא מ-Spotify לא זמין לחשבון הזה");
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
    if (!canUseSpotifyImport) {
      setError("ייבוא מ-Spotify לא זמין לחשבון הזה");
      return;
    }

    setPlaylistsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/me/playlists", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        const msg = (text || "Failed").trim();
        if (msg.includes("Feature not enabled for this account")) {
          throw new Error("ייבוא מ-Spotify לא זמין לחשבון הזה");
        }
        throw new Error(msg);
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
    if (!canUseSpotifyImport) {
      setError("ייבוא מ-Spotify לא זמין לחשבון הזה");
      return;
    }

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
        if (msg.includes("Feature not enabled for this account")) {
          throw new Error("ייבוא מ-Spotify לא זמין לחשבון הזה");
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
            <p className="text-xs text-muted">דורש הגדרת משתני סביבה: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/api/spotify/connect?returnTo=${encodeURIComponent("/admin")}`}
            className={`btn-primary text-sm flex items-center gap-1.5 py-2 px-4 ${!canUseSpotifyImport ? "opacity-50 pointer-events-none" : ""}`}
          >
            <LogIn className="w-4 h-4" />
            התחבר עם Spotify
          </a>
          <button
            type="button"
            onClick={loadPlaylists}
            className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
            disabled={playlistsLoading || !canUseSpotifyImport}
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
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
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
            disabled={importing || !playlistUrl.trim() || !canUseSpotifyImport}
            className={`btn-primary flex-1 ${importing || !playlistUrl.trim() || !canUseSpotifyImport ? "opacity-60 cursor-not-allowed" : ""}`}
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
  categories,
  languages,
  onSave,
  onClose,
}: {
  song: Song | null;
  categories: { value: SongCategory; label: string }[];
  languages: { value: string; label: string }[];
  onSave: (data: Partial<Song>) => Promise<void>;
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const resolvedMedia = resolveSongMedia(previewUrl, externalLink);
  const canAutoFillFromYoutube = resolvedMedia.canAutoFillFromYoutube;

  const uploadFile = async (kind: "audio" | "cover", file: File) => {
    setUploadingKind(kind);
    setUploadError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", kind === "cover" ? "songs/covers" : "songs/audio");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error((data?.error || "Upload failed").trim());
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
    const url = resolvedMedia.inlineUrl || previewUrl.trim();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      await onSave({
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
        isActive: song?.isActive ?? true,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : song ? "עדכון השיר נכשל" : "יצירת השיר נכשלה"
      );
    } finally {
      setSaving(false);
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

        {saveError && (
          <div className="glass-card px-4 py-3 text-sm" style={{ color: "var(--accent-danger)" }}>
            {saveError}
          </div>
        )}

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
          <label className="block text-xs text-muted mb-1">פריוויו לנגן (YouTube / קובץ אודיו)</label>
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
              disabled={metaLoading || !canAutoFillFromYoutube}
              className={`btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 ${metaLoading || !canAutoFillFromYoutube ? "opacity-60 cursor-not-allowed" : ""}`}
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
          <p className="mt-2 text-[11px] text-muted">{resolvedMedia.helperText}</p>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">לינק חיצוני (Spotify / YouTube / פתיחה מחוץ לנגן)</label>
          <input
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            dir="ltr"
            placeholder="https://open.spotify.com/track/..."
            className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors"
          />
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted">זוהה: {resolvedMedia.sourceLabel}</span>
            {resolvedMedia.externalUrl && (
              <a
                href={resolvedMedia.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-blue hover:underline"
                dir="ltr"
              >
                פתח לינק
              </a>
            )}
          </div>
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
          <button type="submit" disabled={saving} className={`btn-primary flex-1 ${saving ? "opacity-60 cursor-not-allowed" : ""}`}>
            {saving ? "שומר..." : song ? "שמור שינויים" : "הוסף שיר"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
