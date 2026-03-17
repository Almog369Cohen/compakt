"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Music, HelpCircle, Sparkles, LogOut, ChevronLeft, BarChart3, Eye, EyeOff, User, Link, CalendarDays } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useEventStore } from "@/stores/eventStore";
import { SongManager } from "@/components/admin/SongManager";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { UpsellManager } from "@/components/admin/UpsellManager";
import { Dashboard } from "@/components/admin/Dashboard";
import { ProfileSettings } from "@/components/admin/ProfileSettings";
import { CoupleLinks } from "@/components/admin/CoupleLinks";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { EventsManager } from "@/components/admin/EventsManager";
import { GuestStats } from "@/components/admin/GuestStats";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabase";
import type { FeatureKey } from "@/lib/access";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { OnboardingFlowV2 } from "@/components/onboarding-v2/OnboardingFlowV2";
import { useOnboardingStoreV2 } from "@/stores/onboardingStoreV2";

type AdminTab = "dashboard" | "songs" | "questions" | "upsells" | "profile" | "couples" | "events" | "analytics" | "guest-stats";

type AdminAccess = {
  role: string;
  isActive: boolean;
  features: Record<FeatureKey, boolean>;
};

const tabDefs: Array<{ id: AdminTab; labelKey: string; icon: React.ReactNode; launchReady?: boolean }> = [
  { id: "dashboard", labelKey: "tabs.dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "couples", labelKey: "tabs.couples", icon: <Link className="w-4 h-4" />, launchReady: true },
  { id: "events", labelKey: "tabs.events", icon: <CalendarDays className="w-4 h-4" />, launchReady: true },
  { id: "guest-stats", labelKey: "tabs.guestStats", icon: <User className="w-4 h-4" />, launchReady: true },
  { id: "profile", labelKey: "tabs.profile", icon: <User className="w-4 h-4" /> },
  { id: "songs", labelKey: "tabs.songs", icon: <Music className="w-4 h-4" /> },
  { id: "questions", labelKey: "tabs.questions", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "upsells", labelKey: "tabs.upsells", icon: <Sparkles className="w-4 h-4" />, launchReady: false },
  { id: "analytics", labelKey: "tabs.analytics", icon: <BarChart3 className="w-4 h-4" />, launchReady: false },
];

// Clerk is optional - only used when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set
// When not set, the app uses Supabase auth only

type AdminPageContentProps = {
  clerkEnabled: boolean;
  clerkLoaded: boolean;
  clerkSignedIn: boolean;
};

function AdminPageContent({ clerkEnabled, clerkLoaded, clerkSignedIn }: AdminPageContentProps) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("common");
  const tabs = tabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey) }));
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const userId = useAdminStore((s) => s.userId);
  const setAuthState = useAdminStore((s) => s.setAuthState);
  const resetAuthState = useAdminStore((s) => s.resetAuthState);
  useAdminStore((s) => s.userEmail);
  const login = useAdminStore((s) => s.login);
  const loginWithEmail = useAdminStore((s) => s.loginWithEmail);
  const loginWithOAuth = useAdminStore((s) => s.loginWithOAuth);
  const signUp = useAdminStore((s) => s.signUp);
  const checkSession = useAdminStore((s) => s.checkSession);
  const loadContentFromDB = useAdminStore((s) => s.loadContentFromDB);
  const contentLoading = useAdminStore((s) => s.contentLoading);
  const contentLoadedProfileId = useAdminStore((s) => s.contentLoadedProfileId);
  const authError = useAdminStore((s) => s.authError);
  const logout = useAdminStore((s) => s.logout);
  const resetContent = useAdminStore((s) => s.resetContent);
  const songs = useAdminStore((s) => s.songs);
  const questions = useAdminStore((s) => s.questions);
  const loadProfileFromDB = useProfileStore((s) => s.loadProfileFromDB);
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const profileId = useProfileStore((s) => s.profileId);
  const djSlug = useProfileStore((s) => s.profile.djSlug);
  const profile = useProfileStore((s) => s.profile);

  // Onboarding state
  const onboardingComplete = useOnboardingStoreV2((s) => s.onboardingComplete);
  const showPreOnboarding = useOnboardingStoreV2((s) => s.showPreOnboarding);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"email" | "legacy">("email");
  const [bypassClerk, setBypassClerk] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetTone, setResetTone] = useState<"error" | "success">("success");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const theme = useEventStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const nextTab = (event as CustomEvent<AdminTab>).detail;
      if (!nextTab) return;
      if (tabs.some((tab) => tab.id === nextTab)) {
        setActiveTab(nextTab);
      }
    };

    window.addEventListener("compakt-admin-tab-change", handleTabChange as EventListener);
    return () => {
      window.removeEventListener("compakt-admin-tab-change", handleTabChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!clerkEnabled) {
      void checkSession();
      return;
    }

    if (clerkLoaded && !clerkSignedIn) {
      void checkSession();
    }
  }, [checkSession, clerkEnabled, clerkLoaded, clerkSignedIn]);

  useEffect(() => {
    if (!supabase) return;

    if (typeof window === "undefined") return;

    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    if (currentUrl.searchParams.get("reset") === "1" && hashParams.get("type") === "recovery") {
      setIsRecoveryMode(true);
      setAuthMode("email");
      setIsSignUp(false);
      setResetMessage(null);
    }

    const {
      data: { subscription },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((event: any, session: Session | null) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setAuthMode("email");
        setIsSignUp(false);
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setResetMessage(null);
        return;
      }

      if (session?.user) {
        setAuthState({
          isAuthenticated: true,
          userId: session.user.id,
          userEmail: session.user.email ?? null,
          authError: null,
        });
        return;
      }

      if (event === "SIGNED_OUT") {
        resetAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, [resetAuthState, setAuthState]);

  const router = useRouter();

  // Load DJ data from Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      // Ensure profile row exists (idempotent — creates only if missing)
      fetch("/api/admin/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.profile?.id) {
            useProfileStore.setState({ profileId: json.profile.id });
          }
          // Redirect staff users to /hq
          if (json.profile?.role === "staff" || json.profile?.role === "owner") {
            router.replace("/hq");
            return;
          }
          fetch("/api/admin/access")
            .then((r) => r.json())
            .then((accessJson) => {
              setAccess(accessJson.access || null);
            })
            .catch(() => {
              setAccess(null);
            });
          // Load full profile data from DB
          loadProfileFromDB(userId);
        })
        .catch(() => {
          // Fallback: try loading directly (profile may already exist)
          loadProfileFromDB(userId);
        });
    }
  }, [isAuthenticated, userId, loadProfileFromDB, router]);

  useEffect(() => {
    const allowedTabs = tabs.filter((tab) => {
      if (!access) return true;
      if (tab.launchReady === false) return false;
      if (tab.id === "analytics") return access.features.analytics;
      if (tab.id === "couples") return access.features.couple_links;
      return true;
    });

    if (!allowedTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("dashboard");
    }
  }, [access, activeTab]);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.launchReady === false) return false;
    if (!access) return true;
    if (tab.id === "analytics") return access.features.analytics;
    if (tab.id === "couples") return access.features.couple_links;
    return true;
  });

  // Load songs/questions/upsells from Supabase when profile is loaded
  useEffect(() => {
    if (profileId) {
      loadContentFromDB(profileId);
    }
  }, [profileId, loadContentFromDB]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetProfile();
      resetContent();
    }
  }, [isAuthenticated, resetContent, resetProfile]);

  const isContentReady = !profileId || (!contentLoading && contentLoadedProfileId === profileId);

  // Check if user is new and should see onboarding
  // Show onboarding if user is new (don't wait for content to load)
  const shouldShowOnboarding = isAuthenticated && !onboardingComplete && !profile.businessName && songs.length === 0 && questions.length === 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setResetMessage(null);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if ((authMode === "email" || bypassClerk) && !normalizedEmail) {
      setResetTone("error");
      setResetMessage(t("auth.errors.emailRequired"));
      return;
    }

    if (!isRecoveryMode && !normalizedPassword) {
      setResetTone("error");
      setResetMessage(t("auth.errors.passwordRequired"));
      return;
    }

    if (isSignUp) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setResetTone("error");
        setResetMessage(t("auth.errors.invalidEmail"));
        return;
      }

      if (normalizedPassword.length < 8 || !/[A-Za-z]/.test(normalizedPassword) || !/\d/.test(normalizedPassword)) {
        setResetTone("error");
        setResetMessage(t("auth.errors.weakPassword"));
        return;
      }
    }

    if (authMode === "legacy") {
      if (!login(normalizedEmail || "admin@compakt.app", normalizedPassword)) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
      return;
    }

    // Email/password mode
    setLoading(true);
    const result = isSignUp
      ? await signUp(normalizedEmail, normalizedPassword)
      : await loginWithEmail(normalizedEmail, normalizedPassword);
    setLoading(false);

    if (isSignUp && result === "pending_confirmation") {
      setResetTone("success");
      setResetMessage(t("auth.success.accountCreated"));
      setIsSignUp(false);
      setPassword("");
      return;
    }

    if (result !== true && result !== "authenticated") {
      const latestAuthError = useAdminStore.getState().authError;
      setResetTone("error");
      setResetMessage(
        latestAuthError || (isSignUp ? t("auth.errors.signupFailed") : t("auth.errors.loginFailed"))
      );
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const handleForgotPassword = async () => {
    setError(false);

    if (!supabase) {
      setResetTone("error");
      setResetMessage("Supabase is not configured");
      return;
    }

    if (!email.trim()) {
      setResetTone("error");
      setResetMessage(t("auth.errors.enterEmailForReset"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin?reset=1` : undefined,
    });
    setLoading(false);

    if (error) {
      setResetTone("error");
      setResetMessage(error.message);
      return;
    }

    setResetTone("success");
    setResetMessage(t("auth.success.resetEmailSent"));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (!supabase) {
      setResetTone("error");
      setResetMessage("Supabase is not configured");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetTone("error");
      setResetMessage(t("auth.errors.shortPassword"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetTone("error");
      setResetMessage(t("auth.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setResetTone("error");
      setResetMessage(error.message);
      return;
    }

    setResetTone("success");
    setResetMessage(t("auth.success.passwordUpdated"));
    setIsRecoveryMode(false);
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      url.hash = "";
      window.history.replaceState({}, "", url.toString());
    }
  };

  if (!hydrated) {
    return (
      <HydrationGuard>
        <div />
      </HydrationGuard>
    );
  }

  // Clerk auth UI removed - using Supabase auth only

  if (!isAuthenticated || isRecoveryMode) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 relative">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => router.push("/home")}
            className="glass-card px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium text-muted hover:text-white hover:scale-105 transition-all"
            aria-label={tc("nav.backToSite")}
          >
            <ChevronLeft className="w-4 h-4" />
            {tc("nav.backToSite")}
          </button>
        </div>

        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={isRecoveryMode ? handleUpdatePassword : handleLogin}
          className="glass-card p-8 w-full max-w-sm text-center"
          data-testid="login-form"
        >
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">
            {isRecoveryMode ? t("auth.resetPassword") : isSignUp ? t("auth.joinCommunity") : t("auth.welcomeBack")}
          </h1>
          <p className="text-sm text-secondary mb-6">
            {isRecoveryMode
              ? t("auth.chooseNewPassword")
              : authMode === "email"
                ? isSignUp ? t("auth.signupSubtitle") : t("auth.loginSubtitle")
                : t("auth.legacySubtitle")}
          </p>

          {(authMode === "email" || bypassClerk) && !isRecoveryMode && (
            <div className="mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
                autoFocus
                data-testid="email-input"
              />
            </div>
          )}

          {isRecoveryMode ? (
            <>
              <div className="relative mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("auth.newPasswordPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors pr-11"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </>
          ) : (
            <>
              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className={`w-full px-4 py-3 rounded-xl bg-transparent border text-sm text-foreground placeholder:text-muted focus:outline-none transition-colors pr-11 ${error ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                    }`}
                  autoFocus={authMode === "legacy"}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isSignUp && (
                <div className="text-xs text-secondary mb-4 text-right bg-white/5 p-3 rounded-lg">
                  <p className="mb-1 font-medium">{t("auth.passwordRequirements")}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>{t("auth.passwordMinLength")}</li>
                    <li>{t("auth.passwordLetter")}</li>
                    <li>{t("auth.passwordNumber")}</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {(error || authError) && (
            <p className="text-xs mb-3" style={{ color: "var(--accent-danger)" }} data-testid="error-message">
              {authError || (isSignUp ? t("auth.errors.signupEmailExists") : t("auth.errors.wrongCredentials"))}
            </p>
          )}

          {resetMessage && (
            <div
              className="text-xs mb-3 p-3 rounded-lg"
              style={{
                backgroundColor: resetTone === "error" ? "var(--accent-danger)15" : "var(--accent-success)15",
                color: resetTone === "error" ? "var(--accent-danger)" : "var(--accent-success)"
              }}
            >
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            data-testid="login-button"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                {isSignUp ? t("auth.creatingAccount") : t("auth.loggingIn")}
              </span>
            ) : isRecoveryMode ? t("auth.updatePasswordButton") : isSignUp ? t("auth.signupButton") : t("auth.loginButton")}
          </button>

          {authMode === "email" && !isRecoveryMode && (
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-secondary">
                {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.newToPlatform")}
              </p>
              <button
                type="button"
                onClick={() => setIsSignUp((v) => !v)}
                className="text-sm text-brand-blue hover:underline font-medium transition-colors"
              >
                {isSignUp ? t("auth.loginHere") : t("auth.createFreeAccount")}
              </button>
            </div>
          )}

          {authMode === "email" && !isSignUp && !isRecoveryMode && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-brand-blue hover:underline mt-2 transition-colors"
            >
              {t("auth.forgotPassword")}
            </button>
          )}

          {isRecoveryMode && (
            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                setNewPassword("");
                setConfirmPassword("");
                setResetMessage(null);
              }}
              className="text-xs text-secondary hover:text-brand-blue mt-3 transition-colors"
            >
              {t("auth.backToLogin")}
            </button>
          )}

          {authMode === "email" && !isRecoveryMode && (
            <div className="mt-4 pt-4 border-t border-glass">
              <p className="text-[11px] text-muted mb-3 text-center">{isSignUp ? t("auth.orSignupWith") : t("auth.orLoginWith")}</p>
              <button
                type="button"
                onClick={() => loginWithOAuth("google")}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-glass text-sm hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>
          )}

          {process.env.NEXT_PUBLIC_ALLOW_LEGACY_LOGIN === "true" && !isRecoveryMode && (
            <div className="mt-4 pt-4 border-t border-glass">
              <button
                type="button"
                onClick={() => {
                  setAuthMode((m) => (m === "email" ? "legacy" : "email"));
                  setBypassClerk(true);
                  setIsSignUp(false);
                  setResetMessage(null);
                  setError(false);
                }}
                className="text-[11px] text-muted hover:text-secondary transition-colors"
              >
                {authMode === "email" ? t("auth.legacyLogin") : t("auth.emailLogin")}
              </button>
            </div>
          )}

          {clerkEnabled && !isRecoveryMode && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setBypassClerk(false);
                  setAuthMode("email");
                  setResetMessage(null);
                  setError(false);
                }}
                className="text-[11px] text-muted hover:text-secondary transition-colors"
              >
                {t("auth.clerkLogin")}
              </button>
            </div>
          )}
        </motion.form>
      </div>
    );
  }

  if (access && !access.isActive) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-4">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">{t("suspended.title")}</h1>
          <p className="text-sm text-secondary mb-6">
            {t("suspended.description")}
          </p>
          <button
            onClick={logout}
            className="btn-primary w-full"
          >
            {t("suspended.logout")}
          </button>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (shouldShowOnboarding || showPreOnboarding) {
    return <OnboardingFlowV2 />;
  }

  if (!isContentReady && ["songs", "questions", "upsells", "couples", "analytics"].includes(activeTab)) {
    return (
      <div className="min-h-dvh gradient-hero">
        <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-lg">Compakt Admin</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-10">
          <div className="glass-card p-8 text-center text-sm text-muted">
            {t("loading.content")}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-hero">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {djSlug ? (
              <a href={`/dj/${djSlug}`} className="text-sm text-secondary hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                {t("header.myProfile")}
              </a>
            ) : (
              <span className="text-sm text-muted">Compakt</span>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-lg">Compakt Admin</h1>
              <p className="text-[11px] text-muted hidden md:block">{t("header.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {/* Tabs */}
            <nav className="flex gap-1 overflow-x-auto max-w-[72vw] lg:max-w-none scrollbar-hide">
              {visibleTabs.map((tab) => (
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

            <LanguageSwitcher variant="icon" />
            <ThemeToggle />
            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
              aria-label={tc("actions.logout")}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`mx-auto px-4 py-6 ${["profile", "couples", "events"].includes(activeTab) ? "max-w-7xl" : "max-w-5xl"}`} data-testid="dashboard">
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
          {activeTab === "couples" && (
            <motion.div
              key="couples"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CoupleLinks />
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
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
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
          {activeTab === "guest-stats" && (
            <motion.div
              key="guest-stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GuestStats />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function AdminPage() {
  // Clerk is disabled - using Supabase auth only
  return (
    <AdminPageContent
      clerkEnabled={false}
      clerkLoaded={false}
      clerkSignedIn={false}
    />
  );
}
