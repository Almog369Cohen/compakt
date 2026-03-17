"use client";

interface GradientBackgroundProps {
  variant?: "default" | "hero" | "cta" | "subtle";
  children?: React.ReactNode;
}

export function GradientBackground({ variant = "default", children }: GradientBackgroundProps) {
  const variants = {
    default: (
      <>
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-3xl" />
      </>
    ),
    hero: (
      <>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      </>
    ),
    cta: (
      <>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
      </>
    ),
    subtle: (
      <>
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-red-100/30 to-orange-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl" />
      </>
    ),
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {variants[variant]}
      {children}
    </div>
  );
}
