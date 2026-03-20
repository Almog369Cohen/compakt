"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";

export function AdminLoginForm() {
  const loginWithEmail = useAdminStore((s) => s.loginWithEmail);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setResetMessage(null);

    if (isSignUp) {
      await loginWithEmail(email, password);
    } else {
      const success = await loginWithEmail(email, password);
      if (!success) {
        setError(true);
      }
    }
  };

  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleLogin}
          className="glass-card p-8 w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Compakt Admin</h1>
            <p className="text-muted">כניסה למערכת ניהול</p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-secondary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                פרטי ההתחברות שגויים
              </div>
            )}

            {resetMessage && (
              <div className="text-green-500 text-sm text-center">
                {resetMessage}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {isSignUp ? "הרשמה" : "התחברות"}
            </motion.button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((prev) => !prev);
                setResetMessage(null);
                setError(false);
              }}
              className="text-[11px] text-muted hover:text-secondary transition-colors"
            >
              {isSignUp ? "כבר יש לי חשבון? התחברות" : "אין לך חשבון? הרשמה"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
