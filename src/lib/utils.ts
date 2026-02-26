import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateMagicToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getSafeOrigin(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");

  if (typeof window === "undefined") return "";
  const { protocol, hostname, host } = window.location;
  if (
    (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") &&
    protocol === "https:"
  ) {
    return `http://${host}`;
  }
  return window.location.origin;
}
