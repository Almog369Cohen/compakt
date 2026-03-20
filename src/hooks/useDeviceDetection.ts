"use client";

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isIPhone: boolean;
  isIPad: boolean;
  isSamsung: boolean;
  isPixel: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  touchSupported: boolean;
  connectionType: string;
  isSlowConnection: boolean;
  deviceType: 'iphone' | 'ipad' | 'android' | 'desktop' | 'unknown';
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isEdge: false,
    isIPhone: false,
    isIPad: false,
    isSamsung: false,
    isPixel: false,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    pixelRatio: 1,
    touchSupported: false,
    connectionType: 'unknown',
    isSlowConnection: false,
    deviceType: 'desktop',
    safeAreaInsets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
      const pixelRatio = window.devicePixelRatio || 1;
      const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Device detection
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isIPhone = /iphone/.test(userAgent);
      const isIPad = /ipad/.test(userAgent) || (isIOS && screenWidth >= 768 && screenWidth <= 1024);
      const isSamsung = /samsung/.test(userAgent);
      const isPixel = /pixel/.test(userAgent);

      // Browser detection
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent);
      const isFirefox = /firefox/.test(userAgent);
      const isEdge = /edge/.test(userAgent) || /edg/.test(userAgent);

      // Device type classification
      let deviceType: DeviceInfo['deviceType'] = 'unknown';
      if (isIPhone) deviceType = 'iphone';
      else if (isIPad) deviceType = 'ipad';
      else if (isAndroid) deviceType = 'android';
      else if (screenWidth >= 1024) deviceType = 'desktop';

      // Mobile/Tablet detection
      const isMobile = screenWidth < 768 || isIPhone || (isAndroid && screenWidth < 768);
      const isTablet = (screenWidth >= 768 && screenWidth < 1024) || isIPad;
      const isDesktop = screenWidth >= 1024 && !isMobile && !isTablet;

      // Safe area insets (iOS notch, Dynamic Island, etc.)
      const safeAreaInsets = {
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0')
      };

      // Network connection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const connectionType = connection?.effectiveType || 'unknown';
      const isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g' || connectionType === '3g';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        isFirefox,
        isEdge,
        isIPhone,
        isIPad,
        isSamsung,
        isPixel,
        screenWidth,
        screenHeight,
        orientation,
        pixelRatio,
        touchSupported,
        connectionType,
        isSlowConnection,
        deviceType,
        safeAreaInsets
      });
    };

    updateDeviceInfo();

    // Listen for orientation changes and resize
    const handleResize = () => updateDeviceInfo();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateDeviceInfo);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (connection) {
        connection.removeEventListener('change', updateDeviceInfo);
      }
    };
  }, []);

  return deviceInfo;
}

// Helper hooks for specific device types
export function useIsIPhone() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.isIPhone;
}

export function useIsAndroid() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.isAndroid;
}

export function useIsMobile() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.isMobile;
}

export function useIsTablet() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.isTablet;
}

export function useSafeAreaInsets() {
  const deviceInfo = useDeviceDetection();
  return deviceInfo.safeAreaInsets;
}

// Utility functions for device-specific behavior
export function getDeviceSpecificStyles(deviceInfo: DeviceInfo) {
  const baseStyles = {
    transition: 'all 0.3s ease',
  };

  if (deviceInfo.isIPhone) {
    return {
      ...baseStyles,
      // iOS-specific styles
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
    };
  }

  if (deviceInfo.isAndroid) {
    return {
      ...baseStyles,
      // Android-specific styles
      fontFamily: 'Roboto, "Segoe UI", sans-serif',
      borderRadius: '8px',
      elevation: '2px',
    };
  }

  return baseStyles;
}

export function getGestureConfig(deviceInfo: DeviceInfo) {
  if (deviceInfo.isIPhone) {
    return {
      swipeThreshold: 50,
      swipeVelocity: 0.3,
      tapThreshold: 10,
      longPressThreshold: 500,
      hapticFeedback: true,
    };
  }

  if (deviceInfo.isAndroid) {
    return {
      swipeThreshold: 60,
      swipeVelocity: 0.4,
      tapThreshold: 12,
      longPressThreshold: 400,
      hapticFeedback: true,
    };
  }

  return {
    swipeThreshold: 40,
    swipeVelocity: 0.2,
    tapThreshold: 8,
    longPressThreshold: 600,
    hapticFeedback: false,
  };
}

// Performance optimization based on device
export function getPerformanceConfig(deviceInfo: DeviceInfo) {
  return {
    enableAnimations: !deviceInfo.isSlowConnection,
    enableHighQualityImages: !deviceInfo.isSlowConnection && deviceInfo.pixelRatio <= 2,
    enableBackgroundSync: deviceInfo.isMobile,
    batchSize: deviceInfo.isMobile ? 10 : 50,
    debounceDelay: deviceInfo.isMobile ? 300 : 150,
  };
}
