"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Play, Pause, ExternalLink, RefreshCw, Search, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useProfileStore } from "@/stores/profileStore";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
  preview_url?: string;
  duration_ms: number;
  external_urls: { spotify: string };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: { total: number };
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface ImportedSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  preview_url?: string;
  external_link?: string;
  category: string;
  tags: string[];
  energy: number;
  language: string;
  is_safe: boolean;
  is_active: boolean;
  sort_order: number;
}

export function SpotifyManager() {
  const { t } = useTranslation("admin");
  const { profile } = useProfileStore();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [importedSongs, setImportedSongs] = useState<ImportedSong[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    checkSpotifyConnection();
    loadPlaylists();
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      const response = await fetch("/api/spotify/me");
      if (response.ok) {
        setIsConnected(true);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await fetch("/api/spotify/playlists");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
    }
  };

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=20`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.tracks?.items || []);
      } else {
        console.error("Search failed:", data.error);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylistTracks = async (playlistId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/spotify/playlists/${playlistId}/tracks`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.tracks || []);
      }
    } catch (error) {
      console.error("Failed to load playlist tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const previewTrack = (track: SpotifyTrack) => {
    if (track.preview_url) {
      if (currentlyPlaying === track.preview_url) {
        setCurrentlyPlaying(null);
      } else {
        setCurrentlyPlaying(track.preview_url);
      }
    }
  };

  const importTrack = async (track: SpotifyTrack) => {
    const songData: ImportedSong = {
      id: `spotify-${track.id}`,
      title: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      album: track.album.name,
      preview_url: track.preview_url,
      external_link: track.external_urls.spotify,
      category: "pop", // Default category - could be improved with Spotify genre analysis
      tags: ["spotify", "imported"],
      energy: 5, // Default energy - could be improved with Spotify audio features
      language: "hebrew", // Default - could be improved with language detection
      is_safe: true,
      is_active: true,
      sort_order: importedSongs.length + 1,
    };

    try {
      const response = await fetch("/api/admin/songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ song: songData }),
      });

      if (response.ok) {
        setImportedSongs([...importedSongs, songData]);
        // Remove from search results
        setSearchResults(searchResults.filter(t => t.id !== track.id));
      }
    } catch (error) {
      console.error("Failed to import track:", error);
    }
  };

  const importPlaylist = async () => {
    if (!selectedPlaylist) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const response = await fetch(`/api/spotify/playlists/${selectedPlaylist}/tracks`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load playlist");
      }

      const tracks = data.tracks || [];
      const total = tracks.length;

      for (let i = 0; i < total; i++) {
        const track = tracks[i];
        await importTrack(track);
        setImportProgress(Math.round(((i + 1) / total) * 100));

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setShowImportDialog(false);
      setSelectedPlaylist(null);
      setImportProgress(0);
    } catch (error) {
      console.error("Failed to import playlist:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const connectSpotify = () => {
    window.open("/api/spotify/connect", "_blank");
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 mx-auto mb-4 text-muted" />
        <h3 className="text-lg font-semibold mb-2">Connect Spotify</h3>
        <p className="text-muted mb-6">
          Connect your Spotify account to import playlists and discover music
        </p>
        <button
          onClick={connectSpotify}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music className="w-6 h-6 text-green-500" />
            Spotify Integration
          </h2>
          <p className="text-muted">Import and manage music from Spotify</p>
        </div>
        <button
          onClick={() => setShowImportDialog(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Import Playlist
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search for tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchTracks()}
              className="w-full px-4 py-2 pr-10 rounded-lg border bg-background"
            />
          </div>
        </div>
        <button
          onClick={searchTracks}
          disabled={isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Playlists */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Playlists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="p-4 bg-card rounded-lg border hover:border-green-500 transition-colors cursor-pointer"
              onClick={() => loadPlaylistTracks(playlist.id)}
            >
              <div className="flex items-center gap-3">
                {playlist.images[0] && (
                  <img
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium truncate">{playlist.name}</h4>
                  <p className="text-sm text-muted">{playlist.tracks.total} tracks</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:border-green-500 transition-colors"
              >
                {track.album.images[0] && (
                  <img
                    src={track.album.images[0].url}
                    alt={track.name}
                    className="w-12 h-12 rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{track.name}</h4>
                  <p className="text-sm text-muted">
                    {track.artists.map(a => a.name).join(", ")} • {track.album.name}
                  </p>
                  <p className="text-xs text-muted">{formatDuration(track.duration_ms)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {track.preview_url && (
                    <button
                      onClick={() => previewTrack(track)}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      {currentlyPlaying === track.preview_url ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => importTrack(track)}
                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <a
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Preview */}
      {currentlyPlaying && (
        <audio
          src={currentlyPlaying}
          autoPlay
          onEnded={() => setCurrentlyPlaying(null)}
          className="hidden"
        />
      )}

      {/* Import Playlist Dialog */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card p-6 rounded-lg border max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">Import Playlist</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Playlist</label>
                  <select
                    value={selectedPlaylist || ""}
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  >
                    <option value="">Choose a playlist...</option>
                    {playlists.map((playlist) => (
                      <option key={playlist.id} value={playlist.id}>
                        {playlist.name} ({playlist.tracks.total} tracks)
                      </option>
                    ))}
                  </select>
                </div>

                {isImporting && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Importing...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowImportDialog(false)}
                  disabled={isImporting}
                  className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={importPlaylist}
                  disabled={!selectedPlaylist || isImporting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isImporting ? "Importing..." : "Import"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
