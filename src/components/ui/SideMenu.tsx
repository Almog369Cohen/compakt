"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Calendar, Music, MessageSquare, Settings, User, LogOut, Sparkles, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  badge?: number;
  divider?: boolean;
}

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  isPremium?: boolean;
}

export function SideMenu({ isOpen, onClose, userName, userEmail, isPremium }: SideMenuProps) {
  const router = useRouter();

  const menuItems: MenuItem[] = [
    { id: "home", label: "דף הבית", icon: Home, path: "/admin" },
    { id: "events", label: "האירועים שלי", icon: Calendar, path: "/admin?tab=events" },
    { id: "songs", label: "רשימת שירים", icon: Music, path: "/admin?tab=songs" },
    { id: "questions", label: "שאלון", icon: MessageSquare, path: "/admin?tab=questions" },
    { id: "divider1", label: "", icon: Home, divider: true },
    { id: "profile", label: "פרופיל", icon: User, path: "/admin?tab=profile" },
    { id: "settings", label: "הגדרות", icon: Settings, path: "/admin?tab=settings" },
    { id: "divider2", label: "", icon: Home, divider: true },
    { id: "help", label: "עזרה ותמיכה", icon: HelpCircle, path: "/help" },
    { id: "logout", label: "התנתק", icon: LogOut, action: () => handleLogout() },
  ];

  const handleNavClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
      onClose();
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    router.push("/");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          />

          {/* Side Menu */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-gradient-to-b from-gray-900 to-black border-l border-white/10 z-50 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">תפריט</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="glass-card p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center text-white font-bold text-lg">
                    {userName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{userName || "משתמש"}</div>
                    <div className="text-xs text-secondary truncate">{userEmail || ""}</div>
                  </div>
                </div>
                {isPremium && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-brand-blue">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-medium">Premium</span>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1">
              {menuItems.map((item) => {
                if (item.divider) {
                  return (
                    <div key={item.id} className="h-px bg-white/5 my-3" />
                  );
                }

                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all text-right group"
                  >
                    <Icon className="w-5 h-5 text-secondary group-hover:text-brand-blue transition-colors" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{item.badge}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-t from-black to-black/95 backdrop-blur-xl border-t border-white/10 p-4">
              <div className="text-center text-xs text-muted">
                <div>Compakt v1.0</div>
                <div className="mt-1">© 2024 כל הזכויות שמורות</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
