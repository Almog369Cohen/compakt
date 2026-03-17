"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function MarketingNav() {
  const { t } = useTranslation("common");

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-[#1f1f21]">Compakt</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-[#4b5563] hover:text-[#059cc0] transition-colors"
            >
              {t("nav.howItWorks")}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[#4b5563] hover:text-[#059cc0] transition-colors"
            >
              {t("nav.pricing")}
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm font-medium text-[#4b5563] hover:text-[#059cc0] transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/admin"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {t("nav.getStarted")}
            </Link>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
