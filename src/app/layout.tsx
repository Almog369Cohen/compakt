import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { AppRuntimeGuard } from "@/components/ui/AppRuntimeGuard";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Compakt — המסע המוזיקלי שלכם",
  description: "תאמו את המוזיקה לאירוע שלכם בצורה כיפית ופשוטה",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Compakt",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" data-theme="night" className={rubik.variable}>
      <body className="font-sans antialiased min-h-dvh" suppressHydrationWarning>
        <LocaleProvider>
          <AppRuntimeGuard>{children}</AppRuntimeGuard>
        </LocaleProvider>
      </body>
    </html>
  );
}
