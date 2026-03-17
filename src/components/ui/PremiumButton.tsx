"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface PremiumButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PremiumButton({
  href,
  onClick,
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled = false,
}: PremiumButtonProps) {
  const baseClasses = "group relative font-semibold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden";

  const sizeClasses = {
    sm: "px-6 py-2.5 rounded-xl text-sm",
    md: "px-8 py-4 rounded-2xl text-base",
    lg: "px-10 py-5 rounded-2xl text-lg",
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white shadow-lg shadow-[#059cc0]/25 hover:shadow-xl hover:shadow-[#059cc0]/40 hover:-translate-y-1",
    secondary: "bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-900 hover:border-[#059cc0]/50 hover:bg-white hover:shadow-lg",
    ghost: "bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50",
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const content = (
    <>
      {variant === "primary" && (
        <span className="absolute inset-0 bg-gradient-to-r from-[#03b28c] to-[#059cc0] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <span className="relative">{children}</span>
      {icon && <span className="relative group-hover:translate-x-1 transition-transform">{icon}</span>}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
