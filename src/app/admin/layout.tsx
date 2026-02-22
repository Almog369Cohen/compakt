import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compakt Admin — ניהול",
  description: "פאנל ניהול Compakt — שירים, שאלות, שדרוגים",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
