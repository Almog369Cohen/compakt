"use client";

import { useEffect, useState } from "react";

type OptionalClerkProviderProps = {
  children: React.ReactNode;
  publishableKey?: string;
};

type ClerkProviderComponent = typeof import("@clerk/nextjs")["ClerkProvider"];

export function OptionalClerkProvider({ children, publishableKey }: OptionalClerkProviderProps) {
  const [ClerkProviderComponent, setClerkProviderComponent] = useState<ClerkProviderComponent | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!publishableKey) {
      setClerkProviderComponent(null);
      return;
    }

    void import("@clerk/nextjs").then((mod) => {
      if (!cancelled) {
        setClerkProviderComponent(() => mod.ClerkProvider);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [publishableKey]);

  if (!publishableKey) {
    return <>{children}</>;
  }

  if (!ClerkProviderComponent) {
    return <>{children}</>;
  }

  return <ClerkProviderComponent publishableKey={publishableKey}>{children}</ClerkProviderComponent>;
}
