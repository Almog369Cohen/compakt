"use client";

import { ClerkProvider } from "@clerk/nextjs";

type OptionalClerkProviderProps = {
  children: React.ReactNode;
  publishableKey?: string;
};

export function OptionalClerkProvider({ children, publishableKey }: OptionalClerkProviderProps) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
