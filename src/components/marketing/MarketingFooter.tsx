"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export function MarketingFooter() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-sm text-[#4b5563]">
              {t("footer.copyright")}
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-[#4b5563] hover:text-[#059cc0] transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-[#4b5563] hover:text-[#059cc0] transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
