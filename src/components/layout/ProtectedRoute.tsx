"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: bizLoading } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || bizLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (profile && !profile.onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [user, profile, authLoading, bizLoading, pathname, router]);

  if (authLoading || bizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}