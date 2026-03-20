import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { AppRuntimeGuard } from "@/components/ui/AppRuntimeGuard";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { validateEnvironment } from "@/lib/env-validation";
import "./globals.css";
import "../styles/mobile.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Compakt — המסע המוזיקלי שלכם",
  description: "תאמו את המוזיקה לאירוע שלכם בצורה כיפית ופשוטה",
  icons: {
    icon: "/favicon.svg",
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ]
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Compakt",
    startupImage: [
      {
        url: "/icons/apple-startup-750x1294.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-startup-1242x2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/icons/apple-startup-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
    "msapplication-TileColor": "#0a0a0f",
    "msapplication-config": "/browserconfig.xml",
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
  // Validate environment on app startup
  validateEnvironment();

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
