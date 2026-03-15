"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useAdminStore } from "@/stores/adminStore";
import { LogOut } from "lucide-react";

export function ClerkAdminAuthSync() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const setAuthState = useAdminStore((s) => s.setAuthState);
  const resetAuthState = useAdminStore((s) => s.resetAuthState);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setAuthState({
        isAuthenticated: true,
        userId: userId ?? null,
        userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
        authError: null,
      });
      return;
    }

    resetAuthState();
  }, [isLoaded, isSignedIn, resetAuthState, setAuthState, user, userId]);

  return null;
}

export function ClerkAdminLogoutButton() {
  const { signOut } = useClerk();
  const resetAuthState = useAdminStore((s) => s.resetAuthState);
  const router = useRouter();

  return (
    <button
      onClick={() => {
        signOut().then(() => {
          resetAuthState();
          router.replace("/admin");
        });
      }}
      className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
      aria-label="התנתקות"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}

export function ClerkSignUpComponent() {
  return <SignUp />;
}

export function ClerkSignInComponent() {
  return <SignIn />;
}

export function useClerkAuth() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useAuth();
  return { clerkLoaded, clerkSignedIn: Boolean(clerkSignedIn) };
}
