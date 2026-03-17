"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface PremiumInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5 rounded-2xl
              bg-white/70 backdrop-blur-xl
              border border-slate-200
              text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#059cc0]/50 focus:border-[#059cc0]
              transition-all duration-200
              ${icon ? 'pl-12' : ''}
              ${error ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = "PremiumInput";
