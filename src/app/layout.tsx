import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = Boolean(clerkPublishableKey);

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-heebo",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyContent = clerkEnabled
    ? await (async () => {
      const { ClerkProvider } = await import("@clerk/nextjs");
      return <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>;
    })()
    : children;

  return (
    <html lang="he" dir="rtl" data-theme="night" className={heebo.variable}>
      <body className="font-heebo antialiased min-h-dvh">
        {bodyContent}
      </body>
    </html>
  );
}
