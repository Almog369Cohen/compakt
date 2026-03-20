"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Building2, Lock, Loader2 } from "lucide-react";
import { getPlan, formatPrice } from "@/lib/pricing";
import type { PlanKey } from "@/lib/access";

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#059cc0]" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = (searchParams.get('plan') || 'pro') as PlanKey;
  const plan = getPlan(planKey);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          plan: planKey
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בהרשמה');
        setLoading(false);
        return;
      }

      // Success - redirect to onboarding
      router.push('/onboarding');
    } catch (err) {
      console.error('Signup error:', err);
      setError('שגיאה בהרשמה. נסו שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-[#4b5563] hover:text-[#059cc0] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          חזרה למחירון
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-[#e5e7eb]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-green-50 border border-[#e5e7eb] mb-4">
              <span className="text-sm font-medium bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
                {plan?.name ?? "Pro"} Plan - {formatPrice(planKey)}/חודש
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#1f1f21] mb-2">
              התחילו ניסיון חינם
            </h1>
            <p className="text-[#4b5563]">
              7 ימים חינם, ללא כרטיס אשראי
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1f1f21] mb-2">
                אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-[#e5e7eb] focus:border-[#059cc0] focus:outline-none transition-colors text-right"
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[#1f1f21] mb-2">
                שם העסק
              </label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-[#e5e7eb] focus:border-[#059cc0] focus:outline-none transition-colors"
                  placeholder="DJ Events"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1f1f21] mb-2">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pr-11 pl-4 py-3 rounded-xl border-2 border-[#e5e7eb] focus:border-[#059cc0] focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">לפחות 6 תווים</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Benefits */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#1f1f21]">
                <div className="w-5 h-5 rounded-full bg-[#03b28c] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>7 ימי ניסיון חינם</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1f1f21]">
                <div className="w-5 h-5 rounded-full bg-[#03b28c] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>ללא כרטיס אשראי</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1f1f21]">
                <div className="w-5 h-5 rounded-full bg-[#03b28c] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>ביטול בכל עת</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  יוצר חשבון...
                </>
              ) : (
                <>
                  התחל עכשיו
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#4b5563]">
              כבר יש לך חשבון?{' '}
              <Link href="/admin" className="text-[#059cc0] hover:underline font-medium">
                התחבר
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#9ca3af]">
            בהרשמה אתם מסכימים ל
            <Link href="/terms" className="underline hover:text-[#059cc0]">תנאי השימוש</Link>
            {' '}ול
            <Link href="/privacy" className="underline hover:text-[#059cc0]">מדיניות הפרטיות</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
