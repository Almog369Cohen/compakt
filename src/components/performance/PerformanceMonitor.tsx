"use client";

import { useState, useEffect } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Clock, AlertTriangle, X } from "lucide-react";

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkSpeed: string;
  batteryLevel?: number;
  isLowPowerMode: boolean;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInProduction?: boolean;
  className?: string;
}

export function PerformanceMonitor({
  enabled = true,
  showInProduction = false,
  className = ""
}: PerformanceMonitorProps) {
  const deviceInfo = useDeviceDetection();
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    networkSpeed: 'Unknown',
    isLowPowerMode: false
  });

  const isDisabled = !enabled || (process.env.NODE_ENV === 'production' && !showInProduction);

  // FPS Monitor
  useEffect(() => {
    if (isDisabled) return;
    let rafId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = lastTime;
    let currentFps = 60;

    const measureFPS = (currentTime: number) => {
      frameCount++;

      if (currentTime - fpsUpdateTime >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (currentTime - fpsUpdateTime));
        frameCount = 0;
        fpsUpdateTime = currentTime;

        setMetrics(prev => ({ ...prev, fps: currentFps }));
      }

      lastTime = currentTime;
      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isDisabled]);

  // Memory Monitor
  useEffect(() => {
    if (isDisabled) return;
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = Math.round((memory.usedJSHeapSize / 1048576) * 100) / 100; // in MB

        setMetrics(prev => ({ ...prev, memoryUsage: usedMemory }));
      }
    };

    const interval = setInterval(measureMemory, 2000);
    return () => clearInterval(interval);
  }, [isDisabled]);

  // Render Time Monitor
  useEffect(() => {
    if (isDisabled) return;
    const measureRenderTime = () => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const endTime = performance.now();
        const renderTime = Math.round((endTime - startTime) * 100) / 100;

        setMetrics(prev => ({ ...prev, renderTime }));
      });
    };

    const interval = setInterval(measureRenderTime, 1000);
    return () => clearInterval(interval);
  }, [isDisabled]);

  // Network Speed Monitor
  useEffect(() => {
    if (isDisabled) return;
    const measureNetworkSpeed = async () => {
      const connection = (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        const speed = connection.effectiveType || 'Unknown';
        setMetrics(prev => ({ ...prev, networkSpeed: speed }));
      }
    };

    measureNetworkSpeed();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', measureNetworkSpeed);
      return () => connection.removeEventListener('change', measureNetworkSpeed);
    }
  }, [isDisabled]);

  // Battery Monitor
  useEffect(() => {
    if (isDisabled) return;
    const measureBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setMetrics(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
            isLowPowerMode: battery.charging === false && battery.level < 0.2
          }));
        } catch (error) {
          // Battery API might not be available
        }
      }
    };

    measureBattery();
  }, [isDisabled]);

  // Performance Status
  const getPerformanceStatus = () => {
    const { fps, memoryUsage, renderTime, networkSpeed, isLowPowerMode } = metrics;

    if (fps < 30 || renderTime > 16 || isLowPowerMode) {
      return 'poor';
    }
    if (fps < 45 || renderTime > 10 || memoryUsage > 100) {
      return 'fair';
    }
    return 'good';
  };

  if (isDisabled) return null;

  const status = getPerformanceStatus();
  const statusColors = {
    good: 'text-green-600 bg-green-100',
    fair: 'text-yellow-600 bg-yellow-100',
    poor: 'text-red-600 bg-red-100'
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed bottom-20 left-4 z-40 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-md transition-all ${className}`}
      >
        <Activity size={20} className={`${status === 'good' ? 'text-green-500' :
            status === 'fair' ? 'text-yellow-500' : 'text-red-500'
          }`} />
      </button>

      {/* Performance Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed top-20 left-4 z-40 w-80 bg-white rounded-lg shadow-xl border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                  {status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-4 space-y-3">
              {/* FPS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">FPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${metrics.fps >= 50 ? 'text-green-600' :
                      metrics.fps >= 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {metrics.fps}
                  </span>
                  <span className="text-xs text-gray-500">/ 60</span>
                </div>
              </div>

              {/* Memory */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${metrics.memoryUsage < 50 ? 'text-green-600' :
                      metrics.memoryUsage < 100 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {metrics.memoryUsage}
                  </span>
                  <span className="text-xs text-gray-500">MB</span>
                </div>
              </div>

              {/* Render Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Render</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${metrics.renderTime <= 8 ? 'text-green-600' :
                      metrics.renderTime <= 16 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {metrics.renderTime}
                  </span>
                  <span className="text-xs text-gray-500">ms</span>
                </div>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Network</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {metrics.networkSpeed}
                </span>
              </div>

              {/* Battery */}
              {metrics.batteryLevel !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Battery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${metrics.batteryLevel > 50 ? 'text-green-600' :
                        metrics.batteryLevel > 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {metrics.batteryLevel}%
                    </span>
                    {metrics.isLowPowerMode && (
                      <AlertTriangle size={12} className="text-orange-500" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Device Info */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 space-y-1">
                <div>Device: {deviceInfo.deviceType}</div>
                <div>Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</div>
                <div>Pixel Ratio: {deviceInfo.pixelRatio}</div>
                <div>Touch: {deviceInfo.touchSupported ? 'Yes' : 'No'}</div>
                <div>Connection: {deviceInfo.connectionType}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Performance Hook
export function usePerformanceMonitor() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const checkPerformance = () => {
      // Simple performance check based on FPS and memory
      const fps = 60; // Would be measured in real implementation
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      if (fps < 30 || memoryUsage > 100 * 1024 * 1024) {
        setIsLowPerformance(true);
        setPerformanceMode('low');
      } else if (fps < 50 || memoryUsage > 50 * 1024 * 1024) {
        setPerformanceMode('medium');
      } else {
        setIsLowPerformance(false);
        setPerformanceMode('high');
      }
    };

    checkPerformance();
    const interval = setInterval(checkPerformance, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    isLowPerformance,
    performanceMode,
    shouldReduceAnimations: performanceMode === 'low',
    shouldUseLowQualityImages: performanceMode === 'low',
    shouldDebounceInteractions: performanceMode !== 'high'
  };
}

// Performance Optimized Component HOC
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>
) {
  return function OptimizedComponent(props: P) {
    const { shouldReduceAnimations, shouldUseLowQualityImages } = usePerformanceMonitor();

    return (
      <div
        className={shouldReduceAnimations ? 'reduce-animations' : ''}
        data-performance-mode={shouldReduceAnimations ? 'low' : 'high'}
      >
        <Component {...props} />
      </div>
    );
  };
}
