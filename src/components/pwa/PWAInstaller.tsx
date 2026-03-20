"use client";

import { useState, useEffect } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone, Chrome, Globe } from "lucide-react";

interface PWAInstallerProps {
  className?: string;
  showInstallPrompt?: boolean;
  onClose?: () => void;
}

export function PWAInstaller({
  className = "",
  showInstallPrompt = true,
  onClose
}: PWAInstallerProps) {
  const deviceInfo = useDeviceDetection();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isWebApp = window.matchMedia('(display-mode: webapp)').matches;

      setIsInstalled(isStandalone || isWebApp);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);

      // Show install prompt after a delay
      if (showInstallPrompt && !userDismissed && !isInstalled) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      // Hide the app-provided install button
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showInstallPrompt, userDismissed, isInstalled]);

  // Handle install click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowPrompt(false);
    setUserDismissed(true);
    onClose?.();
  };

  // Get browser-specific content
  const getBrowserContent = () => {
    if (deviceInfo.isSafari && deviceInfo.isIOS) {
      return {
        title: "הוסף למסך הבית",
        description: "פתח בסאפרי, לחץ על 'שתף' ואז 'הוסף למסך הבית'",
        icon: <Globe size={24} />,
        steps: [
          "לחץ על כפתור 'שתף' בתחתית המסך",
          "גלול למטה ולחץ על 'הוסף למסך הבית'",
          "לחץ על 'הוסף' כדי לאשר"
        ]
      };
    }

    if (deviceInfo.isChrome && deviceInfo.isAndroid) {
      return {
        title: "התקן את Compakt",
        description: "התקן את האפליקציה לגישה מהירה וחווייה מלאה",
        icon: <Chrome size={24} />,
        steps: [
          "לחץ על כפתור 'התקן' למטה",
          "אשר את ההתקנה בחלון שייפתח",
          "האפליקציה תותקן אוטומטית"
        ]
      };
    }

    return {
      title: "התקן את Compakt",
      description: "קבל גישה מהירה וחווייה מוביילית מלאה",
      icon: <Smartphone size={24} />,
      steps: [
        "לחץ על כפתור 'התקן'",
        "אשר את ההתקנה",
        "תהנה מחווייה מוביילית מלאה"
      ]
    };
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt || userDismissed) {
    return null;
  }

  const browserContent = getBrowserContent();

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {browserContent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {browserContent.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {browserContent.description}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Steps */}
            <div className="space-y-2 mb-4">
              {browserContent.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 flex-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {deviceInfo.isSafari && deviceInfo.isIOS ? (
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  הבנתי
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    לא עכשיו
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    התקן
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for PWA installation
export function usePWAInstallation() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setCanInstall(false);
    };

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isWebApp = window.matchMedia('(display-mode: webapp)').matches;
      setIsInstalled(isStandalone || isWebApp);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    checkInstalled();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return {
    canInstall,
    isInstalled,
    install,
  };
}

// PWA Install Banner Component
export function PWAInstallBanner() {
  const { canInstall, isInstalled, install } = usePWAInstallation();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download size={20} />
          <div>
            <p className="font-medium">התקן את Compakt</p>
            <p className="text-sm opacity-90">קבל גישה מהירה מהמסך הבית</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            התקן עכשיו
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
