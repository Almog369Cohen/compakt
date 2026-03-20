"use client";

import { ReactNode, useEffect, useState } from "react";
import { useDeviceDetection, getDeviceSpecificStyles, getPerformanceConfig } from "@/hooks/useDeviceDetection";

interface AdaptiveLayoutProps {
  children: ReactNode;
  className?: string;
  deviceSpecific?: {
    iphone?: ReactNode;
    android?: ReactNode;
    ipad?: ReactNode;
    desktop?: ReactNode;
  };
  layout?: {
    mobile?: 'stack' | 'grid' | 'carousel';
    tablet?: 'grid' | 'split' | 'tabs';
    desktop?: 'grid' | 'sidebar' | 'full';
  };
  safeArea?: boolean;
  statusBarColor?: string;
}

export function AdaptiveLayout({
  children,
  className = "",
  deviceSpecific,
  layout = {
    mobile: 'stack',
    tablet: 'grid',
    desktop: 'sidebar'
  },
  safeArea = true,
  statusBarColor
}: AdaptiveLayoutProps) {
  const deviceInfo = useDeviceDetection();
  const [isInstalled, setIsInstalled] = useState(false);
  const deviceStyles = getDeviceSpecificStyles(deviceInfo);
  const performanceConfig = getPerformanceConfig(deviceInfo);

  // Check if app is installed (PWA)
  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  // Set status bar color for mobile
  useEffect(() => {
    if (statusBarColor && deviceInfo.isMobile) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', statusBarColor);
      }
    }
  }, [statusBarColor, deviceInfo.isMobile]);

  // Get device-specific content
  const getDeviceSpecificContent = () => {
    if (deviceSpecific) {
      if (deviceInfo.isIPhone && deviceSpecific.iphone) return deviceSpecific.iphone;
      if (deviceInfo.isAndroid && deviceSpecific.android) return deviceSpecific.android;
      if (deviceInfo.isIPad && deviceSpecific.ipad) return deviceSpecific.ipad;
      if (deviceInfo.isDesktop && deviceSpecific.desktop) return deviceSpecific.desktop;
    }
    return children;
  };

  // Get layout classes
  const getLayoutClasses = () => {
    const baseClasses = "w-full transition-all duration-300";

    if (deviceInfo.isMobile) {
      switch (layout.mobile) {
        case 'grid':
          return `${baseClasses} grid grid-cols-1 gap-4`;
        case 'carousel':
          return `${baseClasses} overflow-x-auto flex snap-x snap-mandatory`;
        case 'stack':
        default:
          return `${baseClasses} flex flex-col space-y-4`;
      }
    }

    if (deviceInfo.isTablet) {
      switch (layout.tablet) {
        case 'split':
          return `${baseClasses} grid grid-cols-2 gap-6`;
        case 'tabs':
          return `${baseClasses} flex flex-col`;
        case 'grid':
        default:
          return `${baseClasses} grid grid-cols-2 gap-4`;
      }
    }

    if (deviceInfo.isDesktop) {
      switch (layout.desktop) {
        case 'sidebar':
          return `${baseClasses} grid grid-cols-4 gap-6`;
        case 'full':
          return `${baseClasses} max-w-7xl mx-auto`;
        case 'grid':
        default:
          return `${baseClasses} grid grid-cols-3 gap-6`;
      }
    }

    return baseClasses;
  };

  // Get safe area styles
  const getSafeAreaStyles = () => {
    if (!safeArea || !deviceInfo.isMobile) return {};

    const { top, right, bottom, left } = deviceInfo.safeAreaInsets;
    return {
      paddingTop: `${top}px`,
      paddingRight: `${right}px`,
      paddingBottom: `${bottom}px`,
      paddingLeft: `${left}px`,
    };
  };

  // Get device-specific container styles
  const getContainerStyles = () => {
    const styles: React.CSSProperties = {
      ...deviceStyles,
      ...getSafeAreaStyles(),
    };

    // Performance optimizations
    if (!performanceConfig.enableAnimations) {
      styles.transition = 'none';
    }

    // iOS-specific optimizations
    if (deviceInfo.isIPhone) {
      (styles as any).WebkitOverflowScrolling = 'touch';
    }

    // Android-specific optimizations
    if (deviceInfo.isAndroid) {
      styles.overflow = 'auto';
    }

    return styles;
  };

  // Get orientation-specific classes
  const getOrientationClasses = () => {
    if (deviceInfo.orientation === 'landscape') {
      return 'landscape-mode';
    }
    return 'portrait-mode';
  };

  // Get device-specific classes
  const getDeviceClasses = () => {
    const classes = [];

    if (deviceInfo.isIPhone) classes.push('device-iphone');
    if (deviceInfo.isAndroid) classes.push('device-android');
    if (deviceInfo.isIPad) classes.push('device-ipad');
    if (deviceInfo.isSamsung) classes.push('device-samsung');
    if (deviceInfo.isPixel) classes.push('device-pixel');
    if (deviceInfo.isMobile) classes.push('device-mobile');
    if (deviceInfo.isTablet) classes.push('device-tablet');
    if (deviceInfo.isDesktop) classes.push('device-desktop');
    if (isInstalled) classes.push('pwa-installed');
    if (deviceInfo.touchSupported) classes.push('touch-enabled');
    if (deviceInfo.isSlowConnection) classes.push('slow-connection');

    return classes.join(' ');
  };

  return (
    <div
      className={`
        adaptive-layout
        ${getLayoutClasses()}
        ${getOrientationClasses()}
        ${getDeviceClasses()}
        ${className}
      `}
      style={getContainerStyles()}
      data-device={deviceInfo.deviceType}
      data-orientation={deviceInfo.orientation}
      data-pwa={isInstalled}
      data-connection={deviceInfo.connectionType}
    >
      {/* Device-specific content */}
      {getDeviceSpecificContent()}

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded-lg z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div>Device: {deviceInfo.deviceType}</div>
          <div>Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</div>
          <div>Connection: {deviceInfo.connectionType}</div>
          <div>PWA: {isInstalled ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}

// Helper components for specific device layouts
export function IPhoneLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`iphone-layout ${className}`} style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
    }}>
      {children}
    </div>
  );
}

export function AndroidLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`android-layout ${className}`} style={{
      fontFamily: 'Roboto, "Segoe UI", sans-serif',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      {children}
    </div>
  );
}

export function MobileLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  const deviceInfo = useDeviceDetection();

  return (
    <div
      className={`mobile-layout ${className}`}
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        paddingTop: deviceInfo.safeAreaInsets.top,
        paddingBottom: deviceInfo.safeAreaInsets.bottom,
      }}
    >
      {children}
    </div>
  );
}

export function TabletLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`tablet-layout ${className} max-w-6xl mx-auto px-4`}>
      {children}
    </div>
  );
}

export function DesktopLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`desktop-layout ${className} max-w-7xl mx-auto`}>
      {children}
    </div>
  );
}
