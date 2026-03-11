import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compakt HQ — ניהול מערכת",
  description: "פאנל ניהול עבור צוות Compakt",
};

export default function HQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
