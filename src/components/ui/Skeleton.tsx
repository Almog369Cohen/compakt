"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
  animated = true,
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-gray-200",
    animated && "animate-pulse",
    variant === "circular" && "rounded-full",
    variant === "rectangular" && "rounded-none",
    variant === "rounded" && "rounded-xl",
    variant === "text" && "rounded-md",
  );

  const style: React.CSSProperties = {
    width: width ?? "100%",
    height: height ?? (variant === "text" ? "1em" : undefined),
  };

  if (lines > 1 && variant === "text") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={baseClasses}
            style={{
              ...style,
              width: i === lines - 1 ? "75%" : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(baseClasses, className)} style={style} />;
}

/** Card-shaped skeleton for list items */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-2xl bg-white border border-gray-100 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={14} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" lines={2} height={12} />
    </div>
  );
}

/** Full-page skeleton for loading states */
export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      <Skeleton variant="rounded" height={48} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
