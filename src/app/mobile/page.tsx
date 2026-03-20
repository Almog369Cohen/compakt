"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { AdaptiveLayout } from "@/components/adaptive/AdaptiveLayout";
import { MobileNavigation } from "@/components/mobile/MobileNavigation";
import { PWAInstaller } from "@/components/pwa/PWAInstaller";
import { GestureHandler } from "@/components/mobile/GestureHandler";
import { BottomSheet, useBottomSheet } from "@/components/mobile/BottomSheet";
import { SwipeCardStack } from "@/components/mobile/SwipeCard";
import { PerformanceMonitor, usePerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { motion } from "framer-motion";
import {
  Music,
  Calendar,
  Users,
  Settings,
  Heart,
  Play,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  Loader2
} from "lucide-react";

// Sample data for demonstration
const sampleSongs = [
  {
    id: "1",
    title: "Lev Tahor",
    artist: "Eyal Golan",
    album: "Lev Tahor",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa58?w=400&h=400&fit=crop",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 180,
    popularity: 95
  },
  {
    id: "2",
    title: "Mabul",
    artist: "Omer Adam",
    album: "Mabul",
    imageUrl: "https://images.unsplash.com/photo-1471477145656-526eedc2c7f3?w=400&h=400&fit=crop",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 210,
    popularity: 88
  },
  {
    id: "3",
    title: "Katan Aleinu",
    artist: "Static & Ben-El",
    album: "Katan Aleinu",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 195,
    popularity: 92
  }
];

// Skeleton Components
const _SongCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 bg-gray-200 rounded-lg" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
);

export default function MobileHome() {
  useDeviceDetection();
  usePerformanceMonitor();
  const [currentRoute, setCurrentRoute] = useState("/");
  const [title, setTitle] = useState("Compakt");
  const [showBackButton, setShowBackButton] = useState(false);
  const [currentlyPreviewing, setCurrentlyPreviewing] = useState<string | null>(null);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [dislikedSongs, setDislikedSongs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bottomSheet = useBottomSheet();
  const [selectedSong, setSelectedSong] = useState<typeof sampleSongs[number] | null>(null);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Optimized song swipe handler with useCallback
  const handleSongSwipe = useCallback((direction: 'left' | 'right' | 'up', songId: string) => {
    if (direction === 'right') {
      setLikedSongs(prev => {
        const newSet = new Set(prev);
        newSet.add(songId);
        return newSet;
      });
    } else if (direction === 'left') {
      setDislikedSongs(prev => {
        const newSet = new Set(prev);
        newSet.add(songId);
        return newSet;
      });
    } else if (direction === 'up') {
      setLikedSongs(prev => {
        const newSet = new Set(prev);
        newSet.add(songId);
        return newSet;
      });
    }
  }, []);

  // Optimized preview handler
  const handleSongPreview = useCallback((songId: string) => {
    setCurrentlyPreviewing(prev => prev === songId ? null : songId);
  }, []);

  // Memoized stats calculation
  const stats = useMemo(() => ({
    liked: likedSongs.size,
    disliked: dislikedSongs.size,
    remaining: sampleSongs.length - likedSongs.size - dislikedSongs.size,
    completion: Math.round(((likedSongs.size + dislikedSongs.size) / sampleSongs.length) * 100)
  }), [likedSongs, dislikedSongs]);

  // Pull to refresh handler
  const _handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  // Handle navigation
  const handleNavigate = (route: string) => {
    setCurrentRoute(route);

    // Update title based on route
    switch (route) {
      case "/":
        setTitle("Compakt");
        setShowBackButton(false);
        break;
      case "/music-selection":
        setTitle("בחירת מוזיקה");
        setShowBackButton(true);
        break;
      case "/events":
        setTitle("אירועים");
        setShowBackButton(true);
        break;
      case "/couples":
        setTitle("זוגות");
        setShowBackButton(true);
        break;
      case "/admin":
        setTitle("פרופיל");
        setShowBackButton(true);
        break;
      default:
        setTitle("Compakt");
        setShowBackButton(false);
    }
  };

  // Handle song details
  const _handleSongDetails = (song: typeof sampleSongs[number]) => {
    setSelectedSong(song);
    bottomSheet.open();
  };

  // Get mobile-specific content
  const getMobileContent = () => {
    switch (currentRoute) {
      case "/music-selection":
        return (
          <div className="flex-1 flex flex-col">
            {/* Header with Progress */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-b border-gray-200 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-gray-900">בחירת מוזיקה</h1>
                <div className="text-sm font-medium text-blue-600">
                  {stats.completion}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completion}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              <p className="text-sm text-gray-600">
                דירגו את השירים שאתם אוהבים
              </p>
            </motion.div>

            {/* Swipe Cards with Loading */}
            <div className="flex-1 relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <Suspense fallback={<LoadingSpinner />}>
                  <SwipeCardStack
                    songs={sampleSongs}
                    onSwipe={handleSongSwipe}
                    onPreview={handleSongPreview}
                    currentlyPreviewing={currentlyPreviewing || undefined}
                    emptyState={
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          <Music size={48} className="text-gray-400 mb-4" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          🎉 סיימתם את כל השירים!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {stats.liked} שירים נבחרו
                        </p>
                        <div className="flex items-center gap-2">
                          <Heart className="text-red-500 fill-current" size={20} />
                          <span className="text-sm font-medium">תודה על ההשתתפות!</span>
                        </div>
                      </motion.div>
                    }
                  />
                </Suspense>
              )}

              {/* Refresh Indicator */}
              {isRefreshing && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            {/* Enhanced Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-t border-gray-200 px-4 py-3"
            >
              <div className="flex justify-around text-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    className="text-2xl font-bold text-green-600"
                    animate={{ scale: likedSongs.size > 0 ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {stats.liked}
                  </motion.div>
                  <div className="text-xs text-gray-600">אהבתם</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    className="text-2xl font-bold text-red-600"
                    animate={{ scale: dislikedSongs.size > 0 ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {stats.disliked}
                  </motion.div>
                  <div className="text-xs text-gray-600">לא אהבתם</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.remaining}
                  </div>
                  <div className="text-xs text-gray-600">נותרו</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );

      case "/events":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h1 className="text-xl font-bold text-gray-900">אירועים</h1>
            </div>

            <div className="p-4 space-y-4">
              {/* Event Cards */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">אירוע מספר {i}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      פעיל
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>150 אורחים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Music size={16} />
                      <span>45 שירים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={16} />
                      <span>85% התאמה</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "/couples":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h1 className="text-xl font-bold text-gray-900">זוגות</h1>
            </div>

            <div className="p-4 space-y-4">
              {/* Couple Cards */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">זוג מספר {i}</h3>
                      <p className="text-sm text-gray-600 mt-1">אירוע: חתונה</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      פעיל
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>2 אורחים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Music size={16} />
                      <span>25 שירים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={16} />
                      <span>95% התאמה</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "/profile":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <h1 className="text-xl font-bold text-gray-900">פרופיל</h1>
            </div>

            <div className="p-4">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl border border-gray-200 p-6 mb-4"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    DJ
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">DJ Compakt</h2>
                    <p className="text-sm text-gray-600">מקצוען מוזיקה</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                    <div className="text-xs text-gray-600">אירועים</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">450</div>
                    <div className="text-xs text-gray-600">שירים</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1.2K</div>
                    <div className="text-xs text-gray-600">אורחים</div>
                  </div>
                </div>
              </motion.div>

              {/* Settings */}
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
                {[
                  { icon: Music, label: 'הגדרות מוזיקה' },
                  { icon: Calendar, label: 'ניהול אירועים' },
                  { icon: Users, label: 'הזמנות אורחים' },
                  { icon: Settings, label: 'הגדרות' }
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-gray-600" />
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <ChevronDown size={20} className="text-gray-400" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        // Home page
        return (
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6"
            >
              <h1 className="text-2xl font-bold mb-2">ברוכים ל-Compakt</h1>
              <p className="text-blue-100">
                המסע המוזיקלי שלכם מתחיל כאן
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פעולות מהירות</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <GestureHandler
                  onSwipeUp={() => handleNavigate("/music-selection")}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Music size={24} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">בחירת מוזיקה</span>
                    <span className="text-xs text-gray-600">החלקו למעלה</span>
                  </motion.div>
                </GestureHandler>

                <motion.button
                  onClick={() => handleNavigate("/events")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar size={24} className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">אירועים</span>
                    <span className="text-xs text-gray-600">ניהול</span>
                  </div>
                </motion.button>
              </div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">פעילות אחרונות</h2>

                <div className="space-y-3">
                  {[
                    { icon: Star, text: 'הוספתם 15 שירים לאירוע', time: 'לפני שעה', color: 'text-yellow-500' },
                    { icon: Users, text: '25 אורחים הצטרפו', time: 'לפני 3 שעות', color: 'text-blue-500' }
                  ].map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{activity.time}</span>
                        </div>
                        <activity.icon size={16} className={activity.color} />
                      </div>
                      <p className="font-medium text-gray-900">{activity.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <AdaptiveLayout
      className="mobile-app"
      safeArea={true}
      statusBarColor="#0a0a0f"
    >
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Mobile Navigation */}
        <MobileNavigation
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          title={title}
          showBackButton={showBackButton}
          rightActions={
            currentRoute === "/" && (
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Settings size={24} />
              </button>
            )
          }
        />

        {/* Main Content */}
        {getMobileContent()}

        {/* PWA Installer */}
        <PWAInstaller />

        {/* Performance Monitor */}
        <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />

        {/* Song Details Bottom Sheet */}
        <BottomSheet
          isOpen={bottomSheet.isOpen}
          onClose={bottomSheet.close}
          title={selectedSong?.title}
          subtitle={selectedSong?.artist}
          height="auto"
        >
          {selectedSong && (
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selectedSong.imageUrl}
                  alt={selectedSong.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedSong.title}</h3>
                  <p className="text-gray-600">{selectedSong.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{selectedSong.popularity}%</span>
                    </div>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{selectedSong.duration}s</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleSongPreview(selectedSong.id);
                    bottomSheet.close();
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={16} />
                  הפעל תצוגה
                </button>

                <button
                  onClick={() => {
                    handleSongSwipe('right', selectedSong.id);
                    bottomSheet.close();
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Heart size={16} />
                  אהבתי
                </button>
              </div>
            </div>
          )}
        </BottomSheet>
      </div>
    </AdaptiveLayout>
  );
}
