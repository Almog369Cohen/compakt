"use client";

import { useState, useEffect, useRef } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  height?: 'auto' | 'half' | 'full' | number;
  draggable?: boolean;
  showCloseButton?: boolean;
  disableBackdropClose?: boolean;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  height = 'auto',
  draggable = true,
  showCloseButton = true,
  disableBackdropClose = false,
  className = ""
}: BottomSheetProps) {
  const deviceInfo = useDeviceDetection();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate sheet height
  const getSheetHeight = () => {
    if (typeof height === 'number') return height;

    switch (height) {
      case 'half':
        return '50vh';
      case 'full':
        return '90vh';
      case 'auto':
      default:
        return 'auto';
    }
  };

  // Handle drag start
  const handleDragStart = (clientY: number) => {
    if (!draggable) return;

    setIsDragging(true);
    setDragStartY(clientY);
    setCurrentY(0);
  };

  // Handle drag move
  const handleDragMove = (clientY: number) => {
    if (!isDragging || !draggable) return;

    const deltaY = clientY - dragStartY;
    setCurrentY(Math.max(0, deltaY));
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!isDragging || !draggable) return;

    const threshold = 100; // pixels
    if (currentY > threshold) {
      onClose();
    } else {
      setCurrentY(0);
    }

    setIsDragging(false);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add global listeners for drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        handleDragMove(touch.clientY);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, currentY, dragStartY]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!disableBackdropClose) {
      onClose();
    }
  };

  // Get device-specific styles
  const getSheetStyles = () => {
    const baseStyles = "fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50";

    if (deviceInfo.isIPhone) {
      return `${baseStyles} pb-[env(safe-area-inset-bottom,20px)]`;
    }

    return baseStyles;
  };

  // Animation variants
  const sheetVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
    },
    visible: {
      y: currentY > 0 ? currentY : 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={getSheetStyles()}
            style={{
              height: getSheetHeight(),
              maxHeight: '90vh',
            }}
          >
            {/* Drag Handle */}
            {draggable && (
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || subtitle || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex-1">
                  {title && (
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="סגור"
                  >
                    {deviceInfo.isIPhone ? (
                      <ChevronDown size={24} />
                    ) : (
                      <X size={24} />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto"
              style={{
                maxHeight: height === 'full' ? 'calc(90vh - 120px)' : 'none',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for managing bottom sheet state
export function useBottomSheet(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Predefined bottom sheet components
interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    destructive?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }>;
  cancelAction?: {
    label: string;
    onClick: () => void;
  };
}

export function ActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  cancelAction
}: ActionSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      height="auto"
      draggable={false}
    >
      <div className="px-6 py-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${action.destructive
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-900 hover:bg-gray-100'
              }
              ${action.disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }
            `}
          >
            {action.icon && (
              <span className="flex-shrink-0">
                {action.icon}
              </span>
            )}
            <span className="font-medium text-right">
              {action.label}
            </span>
          </button>
        ))}

        {cancelAction && (
          <button
            onClick={() => {
              cancelAction.onClick();
              onClose();
            }}
            className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelAction.label}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

// Share Sheet Component
interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
  text?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  title = "שתף",
  url,
  text
}: ShareSheetProps) {
  const deviceInfo = useDeviceDetection();

  const shareActions = [
    {
      id: 'native-share',
      label: 'שתף...',
      icon: <ShareIcon />,
      onClick: async () => {
        if (navigator.share && url) {
          try {
            await navigator.share({
              title,
              text,
              url,
            });
          } catch (error) {
            console.log('Share cancelled or failed:', error);
          }
        }
      },
    },
    {
      id: 'copy-link',
      label: 'העתק קישור',
      icon: <LinkIcon />,
      onClick: async () => {
        if (url) {
          try {
            await navigator.clipboard.writeText(url);
            // Show toast or notification
          } catch (error) {
            console.log('Copy failed:', error);
          }
        }
      },
    },
    // Add more sharing options based on platform
    ...(deviceInfo.isIPhone ? [
      {
        id: 'airdrop',
        label: 'AirDrop',
        icon: <AirDropIcon />,
        onClick: () => {
          // Handle AirDrop sharing
        },
      },
    ] : []),
    ...(deviceInfo.isAndroid ? [
      {
        id: 'android-share',
        label: 'שתף באנדרואיד',
        icon: <AndroidShareIcon />,
        onClick: () => {
          // Handle Android sharing
        },
      },
    ] : []),
  ];

  return (
    <ActionSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={shareActions}
      cancelAction={{
        label: 'ביטול',
        onClick: () => { },
      }}
    />
  );
}

// Icon components (simplified versions)
function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function AirDropIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function AndroidShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
    </svg>
  );
}
