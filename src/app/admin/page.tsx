"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Music, HelpCircle, Sparkles, LogOut, ChevronLeft, BarChart3, Calendar, Eye, EyeOff, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEventStore } from "@/stores/eventStore";
import { SongManager } from "@/components/admin/SongManager";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { UpsellManager } from "@/components/admin/UpsellManager";
import { Dashboard } from "@/components/admin/Dashboard";
import { ProfileSettings } from "@/components/admin/ProfileSettings";
import { EventsManager } from "@/components/admin/EventsManager";
import { useProfileStore } from "@/stores/profileStore";

type AdminTab = "dashboard" | "songs" | "questions" | "upsells" | "profile" | "events";

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "דשבורד", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "profile", label: "פרופיל", icon: <User className="w-4 h-4" /> },
  { id: "events", label: "אירועים", icon: <Calendar className="w-4 h-4" /> },
  { id: "songs", label: "שירים", icon: <Music className="w-4 h-4" /> },
  { id: "questions", label: "שאלות", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "upsells", label: "שדרוגים", icon: <Sparkles className="w-4 h-4" /> },
];

export default function AdminPage() {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const userId = useAdminStore((s) => s.userId);
  const login = useAdminStore((s) => s.login);
  const loginWithEmail = useAdminStore((s) => s.loginWithEmail);
  const loginWithOAuth = useAdminStore((s) => s.loginWithOAuth);
  const signUp = useAdminStore((s) => s.signUp);
  const checkSession = useAdminStore((s) => s.checkSession);
  const loadContentFromDB = useAdminStore((s) => s.loadContentFromDB);
  const authError = useAdminStore((s) => s.authError);
  const logout = useAdminStore((s) => s.logout);
  const loadProfileFromDB = useProfileStore((s) => s.loadProfileFromDB);
  const profileId = useProfileStore((s) => s.profileId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"email" | "legacy">("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const theme = useEventStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load DJ data from Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadProfileFromDB(userId);
    } else if (isAuthenticated && !userId) {
      // Legacy auth fallback: load first profile via API
      fetch("/api/admin/profile?first=true")
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.id) {
            useProfileStore.setState({
              profileId: json.data.id,
              profile: {
                businessName: json.data.business_name ?? "",
                tagline: json.data.tagline ?? "",
                bio: json.data.bio ?? "",
                accentColor: json.data.accent_color ?? "#059cc0",
                djSlug: json.data.dj_slug ?? "",
                instagramUrl: json.data.instagram_url ?? "",
                tiktokUrl: json.data.tiktok_url ?? "",
                soundcloudUrl: json.data.soundcloud_url ?? "",
                spotifyUrl: json.data.spotify_url ?? "",
                youtubeUrl: json.data.youtube_url ?? "",
                websiteUrl: json.data.website_url ?? "",
                whatsappNumber: json.data.whatsapp_number ?? "",
                coverUrl: json.data.cover_url ?? "",
                logoUrl: json.data.logo_url ?? "",
                customLinks: Array.isArray(json.data.custom_links) ? json.data.custom_links : [],
                galleryPhotos: Array.isArray(json.data.gallery_photos) ? json.data.gallery_photos : [],
                reviews: Array.isArray(json.data.reviews) ? json.data.reviews : [],
              },
            });
          }
        })
        .catch(() => { });
    }
  }, [isAuthenticated, userId, loadProfileFromDB]);

  // Load songs/questions/upsells from Supabase when profile is loaded
  useEffect(() => {
    if (profileId) {
      loadContentFromDB(profileId);
    }
  }, [profileId, loadContentFromDB]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (authMode === "legacy") {
      if (!login(password)) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
      return;
    }

    // Email/password mode
    setLoading(true);
    const ok = isSignUp
      ? await signUp(email, password)
      : await loginWithEmail(email, password);
    setLoading(false);

    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-4">
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleLogin}
          className="glass-card p-8 w-full max-w-sm text-center"
        >
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">Compakt Admin</h1>
          <p className="text-sm text-secondary mb-6">
            {authMode === "email"
              ? isSignUp ? "צרו חשבון DJ חדש" : "התחברו עם אימייל וסיסמה"
              : "הכניסו סיסמה כדי להיכנס"}
          </p>

          {authMode === "email" && (
            <div className="mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
                autoFocus
              />
            </div>
          )}

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
              className={`w-full px-4 py-3 rounded-xl bg-transparent border text-sm text-foreground placeholder:text-muted focus:outline-none transition-colors pr-11 ${error ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                }`}
              autoFocus={authMode === "legacy"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
              title={showPassword ? "הסתר" : "הצג"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {(error || authError) && (
            <p className="text-xs mb-3" style={{ color: "var(--accent-danger)" }}>
              {authError || "סיסמה שגויה"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "מתחבר..." : isSignUp ? "הרשמה" : "כניסה"}
          </button>

          {authMode === "email" && (
            <button
              type="button"
              onClick={() => setIsSignUp((v) => !v)}
              className="text-xs text-secondary hover:text-brand-blue mt-3 transition-colors"
            >
              {isSignUp ? "כבר יש לי חשבון → כניסה" : "אין לי חשבון → הרשמה"}
            </button>
          )}

          {authMode === "email" && (
            <div className="mt-4 pt-4 border-t border-glass space-y-2">
              <p className="text-[11px] text-muted mb-2">או התחברו עם</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => loginWithOAuth("google")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass text-sm hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => loginWithOAuth("facebook")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass text-sm hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => loginWithOAuth("apple")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass text-sm hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-glass">
            <button
              type="button"
              onClick={() => {
                setAuthMode((m) => (m === "email" ? "legacy" : "email"));
                setError(false);
              }}
              className="text-[11px] text-muted hover:text-secondary transition-colors"
            >
              {authMode === "email" ? "כניסה עם סיסמת מנהל" : "כניסה עם אימייל"}
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-secondary hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              חזרה
            </a>
            <h1 className="font-bold text-lg">Compakt Admin</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <nav className="flex gap-1 overflow-x-auto max-w-[70vw] sm:max-w-none scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                    ? "bg-brand-blue text-white"
                    : "text-secondary hover:text-foreground"
                    }`}
                >
                  {tab.icon}
                  <span className={activeTab === tab.id ? "inline" : "hidden sm:inline"}>{tab.label}</span>
                </button>
              ))}
            </nav>

            <ThemeToggle />
            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
              aria-label="התנתקות"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`mx-auto px-4 py-6 ${activeTab === "profile" || activeTab === "events" ? "max-w-7xl" : "max-w-5xl"}`}>
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProfileSettings />
            </motion.div>
          )}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Dashboard />
            </motion.div>
          )}
          {activeTab === "songs" && (
            <motion.div
              key="songs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SongManager />
            </motion.div>
          )}
          {activeTab === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QuestionManager />
            </motion.div>
          )}
          {activeTab === "upsells" && (
            <motion.div
              key="upsells"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UpsellManager />
            </motion.div>
          )}
          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <EventsManager />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
