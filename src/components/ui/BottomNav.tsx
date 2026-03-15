"use client";

import { Home, Calendar, Music, Settings, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "home", label: "בית", icon: Home, path: "/admin" },
  { id: "events", label: "אירועים", icon: Calendar, path: "/admin?tab=events" },
  { id: "songs", label: "שירים", icon: Music, path: "/admin?tab=songs" },
  { id: "settings", label: "הגדרות", icon: Settings, path: "/admin?tab=profile" },
];

interface BottomNavProps {
  onMenuClick?: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (item: NavItem) => {
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />
      
      {/* Navigation */}
      <div className="relative px-2 py-2 safe-area-bottom">
        <div className="flex items-center justify-around gap-1">
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all active:scale-95"
          >
            <Menu className="w-6 h-6 text-secondary mb-1" />
            <span className="text-[10px] font-medium text-secondary">תפריט</span>
          </button>

          {/* Nav Items */}
          {navItems.map((item) => {
            const isActive = pathname === item.path || 
              (item.path.includes("?tab=") && pathname.includes(item.path.split("?")[0]));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`relative flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all active:scale-95 ${
                  isActive ? "text-white" : "text-secondary"
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-green/20 rounded-xl border border-brand-blue/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 ${isActive ? "text-brand-blue" : ""}`} />
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] font-medium relative ${isActive ? "text-brand-blue" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom bg-black/80" />
    </div>
  );
}
