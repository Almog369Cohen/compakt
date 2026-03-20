"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music, HelpCircle, Sparkles, LogOut, BarChart3, User, Link, CalendarDays, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAdminStore } from "@/stores/adminStore";
import { SongManager } from "@/components/admin/SongManager";
import { QuestionManager } from "@/components/admin/QuestionManager";
import { UpsellManager } from "@/components/admin/UpsellManager";
import { Dashboard } from "@/components/admin/Dashboard";
import { ProfileSettings } from "@/components/admin/ProfileSettings";
import { CoupleLinks } from "@/components/admin/CoupleLinks";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { EventsManager } from "@/components/admin/EventsManager";
import { GuestStats } from "@/components/admin/GuestStats";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import type { FeatureKey } from "@/lib/access";

export type AdminTab = "dashboard" | "songs" | "questions" | "upsells" | "profile" | "couples" | "events" | "analytics" | "guest-stats";

export type AdminAccess = {
  role: string;
  isActive: boolean;
  features: Record<FeatureKey, boolean>;
  hq_access?: boolean;
};

const tabDefs: Array<{ id: AdminTab; labelKey: string; icon: React.ReactNode; launchReady?: boolean }> = [
  { id: "dashboard", labelKey: "tabs.dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "couples", labelKey: "tabs.couples", icon: <Link className="w-4 h-4" /> },
  { id: "events", labelKey: "tabs.events", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "profile", labelKey: "tabs.profile", icon: <User className="w-4 h-4" /> },
  { id: "songs", labelKey: "tabs.songs", icon: <Music className="w-4 h-4" /> },
  { id: "questions", labelKey: "tabs.questions", icon: <HelpCircle className="w-4 h-4" /> },
  { id: "upsells", labelKey: "tabs.upsells", icon: <Sparkles className="w-4 h-4" />, launchReady: false },
  { id: "analytics", labelKey: "tabs.analytics", icon: <BarChart3 className="w-4 h-4" />, launchReady: false },
];

interface AdminShellProps {
  access: AdminAccess | null;
}

export function AdminShell({ access }: AdminShellProps) {
  const { t } = useTranslation("admin");
  const tabs = tabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey) }));
  const logout = useAdminStore((s) => s.logout);
  const router = useRouter();
  const deviceInfo = useDeviceDetection();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Mobile navigation state
  const [currentRoute, setCurrentRoute] = useState("/admin");
  const [mobileTitle, setMobileTitle] = useState("Compakt Admin");

  const handleMobileNavigate = (route: string) => {
    setCurrentRoute(route);
    if (route === "/admin" || route === "/") {
      setActiveTab("dashboard");
      setMobileTitle("Dashboard");
    } else if (route === "/admin/songs") {
      setActiveTab("songs");
      setMobileTitle("Songs");
    } else if (route === "/admin/questions") {
      setActiveTab("questions");
      setMobileTitle("Questions");
    } else if (route === "/admin/events") {
      setActiveTab("events");
      setMobileTitle("Events");
    } else if (route === "/admin/profile") {
      setActiveTab("profile");
      setMobileTitle("Profile");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "songs":
        return <SongManager />;
      case "questions":
        return <QuestionManager />;
      case "upsells":
        return <UpsellManager />;
      case "profile":
        return <ProfileSettings />;
      case "couples":
        return <CoupleLinks />;
      case "events":
        return <EventsManager />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "guest-stats":
        return <GuestStats />;
      default:
        return <Dashboard />;
    }
  };

  if (deviceInfo.isMobile) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <MobileNavigation
          currentRoute={currentRoute}
          onNavigate={handleMobileNavigate}
          title={mobileTitle}
          rightActions={
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="התנתק"
            >
              <LogOut size={20} />
            </button>
          }
        />
        <div className="pb-20">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Compakt Admin</h1>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                  {access?.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {access?.hq_access && (
                <a
                  href="/hq"
                  className="p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                  title="מערכת צוות"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">צוות</span>
                </a>
              )}
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="התנתק"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </main>
    </div>
  );
}
