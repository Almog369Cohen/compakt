"use client";

import { useState, useEffect, useRef } from "react";
import { useDeviceDetection, getGestureConfig } from "@/hooks/useDeviceDetection";
import { motion } from "framer-motion";
import {
  Home,
  Music,
  Calendar,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Users,
  BarChart3,
  HelpCircle,
  Book,
  LogOut
} from "lucide-react";

interface MobileNavigationProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  rightActions?: React.ReactNode;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
  disabled?: boolean;
}

export function MobileNavigation({
  currentRoute = "/",
  onNavigate,
  showBackButton = false,
  onBack,
  title,
  rightActions,
  className = ""
}: MobileNavigationProps) {
  const deviceInfo = useDeviceDetection();
  const gestureConfig = getGestureConfig(deviceInfo);
  const [activeTab, setActiveTab] = useState(currentRoute);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  // Enhanced navigation items with better labels and descriptions
  const navItems: NavItem[] = [
    {
      id: "home",
      label: "בית",
      icon: <Home size={24} />,
      route: "/",
      badge: 0,
    },
    {
      id: "music",
      label: "מוזיקה",
      icon: <Music size={24} />,
      route: "/music-selection",
      badge: 0,
    },
    {
      id: "events",
      label: "אירועים",
      icon: <Calendar size={24} />,
      route: "/events",
      badge: 0,
    },
    {
      id: "couples",
      label: "זוגות",
      icon: <Users size={24} />,
      route: "/couples",
      badge: 0,
    },
    {
      id: "profile",
      label: "פרופיל",
      icon: <User size={24} />,
      route: "/admin",
      badge: 0,
    },
  ];

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!gestureConfig.hapticFeedback || !deviceInfo.isMobile) return;

    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([30, 10, 30]);
          break;
      }
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchStartY.current = e.changedTouches[0].screenY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    touchEndY.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Check if it's a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > gestureConfig.swipeThreshold) {
        const direction = deltaX > 0 ? 'right' : 'left';
        setSwipeDirection(direction);

        // Handle swipe navigation
        handleSwipeNavigation(direction);

        // Reset after animation
        setTimeout(() => setSwipeDirection(null), 300);
      }
    }
  };

  const handleSwipeNavigation = (direction: 'left' | 'right') => {
    const currentIndex = navItems.findIndex(item => item.id === activeTab);

    if (direction === 'right' && currentIndex > 0) {
      // Swipe right - go to previous tab
      const prevItem = navItems[currentIndex - 1];
      handleTabClick(prevItem.id, prevItem.route);
    } else if (direction === 'left' && currentIndex < navItems.length - 1) {
      // Swipe left - go to next tab
      const nextItem = navItems[currentIndex + 1];
      handleTabClick(nextItem.id, nextItem.route);
    }
  };

  const handleTabClick = (tabId: string, route: string) => {
    setActiveTab(tabId);
    triggerHaptic('light');

    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.href = route;
    }
  };

  const handleBack = () => {
    triggerHaptic('medium');
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    triggerHaptic('light');
  };

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(currentRoute);
  }, [currentRoute]);

  // Get device-specific styles
  const getNavigationStyles = () => {
    const baseStyles = "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50";

    if (deviceInfo.isIPhone) {
      return `${baseStyles} pb-[env(safe-area-inset-bottom,20px)]`;
    }

    if (deviceInfo.isAndroid) {
      return `${baseStyles} pb-2`;
    }

    return baseStyles;
  };

  const getHeaderStyles = () => {
    const baseStyles = "fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50";

    if (deviceInfo.isIPhone) {
      return `${baseStyles} pt-[env(safe-area-inset-top,44px)]`;
    }

    return baseStyles;
  };

  // Render header
  const renderHeader = () => {
    if (!title && !showBackButton && !rightActions) return null;

    return (
      <div className={getHeaderStyles()}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="חזור"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {rightActions}
            <button
              onClick={toggleMenu}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="תפריט"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render enhanced bottom navigation - Spotify-style
  const renderBottomNav = () => {
    return (
      <div
        className={getNavigationStyles()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || currentRoute.includes(item.route);

            return (
              <motion.button
                key={item.id}
                onClick={() => handleTabClick(item.id, item.route)}
                disabled={item.disabled}
                className={`
                  relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl transition-all
                  ${isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${swipeDirection ? 'pointer-events-none' : ''}
                `}
                style={{
                  transform: swipeDirection === 'left' ? 'translateX(-4px)' :
                    swipeDirection === 'right' ? 'translateX(4px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: isActive ? Infinity : 0,
                      repeatDelay: 2,
                    }}
                  >
                    {item.icon}
                  </motion.div>
                  {item.badge && item.badge > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.span>
                  )}
                </div>
                <span className={`text-xs mt-1 font-medium transition-colors ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                  }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render enhanced slide-out menu - Facebook-style
  const renderSlideOutMenu = () => {
    if (!isMenuOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu panel */}
        <motion.div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-hidden ${deviceInfo.isIPhone ? 'pt-[env(safe-area-inset-top,44px)]' : ''
            }`}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Header with user info */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">תפריט</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* User Profile Section */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                DJ
              </div>
              <div>
                <div className="font-semibold text-lg">DJ Compakt</div>
                <div className="text-blue-100 text-sm">מקצוען מוזיקה</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-blue-100">פעיל</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ניווט ראשי</h3>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        handleTabClick(item.id, item.route);
                        setIsMenuOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl transition-all
                        ${isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-900 border border-transparent'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium">{item.label}</div>
                        {isActive && (
                          <div className="text-xs text-blue-600">עמוד נוכחי</div>
                        )}
                      </div>
                      {item.badge && item.badge > 0 && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{item.badge}</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Management Section */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ניהול</h3>
              <div className="space-y-2">
                {[
                  { icon: <Settings size={20} />, label: 'הגדרות', description: 'הגדרות מערכת' },
                  { icon: <BarChart3 size={20} />, label: 'סטטיסטיקה', description: 'ניתוח נתונים' },
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    onClick={() => {
                      // Handle management actions
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">עזרה</h3>
              <div className="space-y-2">
                {[
                  { icon: <HelpCircle size={20} />, label: 'תמיכה', description: 'עזרה ותמיכה' },
                  { icon: <Book size={20} />, label: 'מדריך', description: 'מדריך למשתמש' },
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    onClick={() => {
                      // Handle help actions
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-gray-900 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Account Section */}
            <div className="p-4 border-t border-gray-200">
              <motion.button
                onClick={() => {
                  // Handle logout
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <LogOut size={20} />
                </div>
                <div className="flex-1 text-right">
                  <div className="font-medium">התנתק</div>
                  <div className="text-xs text-red-500">יציאה מהמערכת</div>
                </div>
              </motion.button>
            </div>
          </nav>
        </motion.div>
      </>
    );
  };

  return (
    <div className={`mobile-navigation ${className}`}>
      {renderHeader()}
      {renderBottomNav()}
      {renderSlideOutMenu()}

      {/* Add padding for content to avoid being hidden behind navigation */}
      <div className="pb-20" />
    </div>
  );
}

// Helper hook for navigation state
export function useMobileNavigation() {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [title, setTitle] = useState('');
  const [showBackButton, setShowBackButton] = useState(false);

  const navigate = (route: string, options?: { title?: string; showBack?: boolean }) => {
    setCurrentRoute(route);
    if (options?.title) setTitle(options.title);
    if (options?.showBack !== undefined) setShowBackButton(options.showBack);
  };

  const goBack = () => {
    window.history.back();
  };

  return {
    currentRoute,
    title,
    showBackButton,
    navigate,
    goBack,
    setTitle,
    setShowBackButton,
  };
}
