"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Music, HelpCircle, Sparkles, LogOut, ChevronLeft, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEventStore } from "@/stores/eventStore";
import { SongManager } from "@/components/admin/SongManager";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { UpsellManager } from "@/components/admin/UpsellManager";
import { Dashboard } from "@/components/admin/Dashboard";

type AdminTab = "dashboard" | "songs" | "questions" | "upsells";

const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "דשבורד", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "songs", label: "שירים", icon: <Music className="w-4 h-4" /> },
  { id: "questions", label: "שאלות", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "upsells", label: "שדרוגים", icon: <Sparkles className="w-4 h-4" /> },
];

export default function AdminPage() {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const login = useAdminStore((s) => s.login);
  const logout = useAdminStore((s) => s.logout);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const theme = useEventStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(password)) {
      setError(true);
      setTimeout(() => setError(false), 2000);
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
          <p className="text-sm text-secondary mb-6">הכניסו סיסמה כדי להיכנס</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className={`w-full px-4 py-3 rounded-xl bg-transparent border text-sm text-foreground placeholder:text-muted focus:outline-none transition-colors mb-4 ${error ? "border-accent-danger" : "border-glass focus:border-brand-blue"
              }`}
            autoFocus
          />

          {error && (
            <p className="text-xs mb-3" style={{ color: "var(--accent-danger)" }}>
              סיסמה שגויה
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            כניסה
          </button>
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
            <nav className="flex gap-1">
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
                  <span className="hidden sm:inline">{tab.label}</span>
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
      <main className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
      </main>
    </div>
  );
}
