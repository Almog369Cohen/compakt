"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/stores/adminStore";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminShell, type AdminAccess } from "@/components/admin/AdminShell";
import { HydrationGuard } from "@/components/ui/HydrationGuard";

export default function AdminPage() {
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);
  const logout = useAdminStore((s) => s.logout);
  const router = useRouter();
  const [access] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center">
        <div className="text-center text-muted">טוען...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  if (access && !access.isActive) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-4">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">החשבון מושהה</h1>
          <p className="text-muted mb-4">החשבון שלך הושעה. צור קשר לתמיכה.</p>
          <button
            onClick={() => { logout(); router.push("/admin"); }}
            className="btn-secondary"
          >
            התנתק
          </button>
        </div>
      </div>
    );
  }

  return (
    <HydrationGuard>
      <AdminShell access={access} />
    </HydrationGuard>
  );
}
