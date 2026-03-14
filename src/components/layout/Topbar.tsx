"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";

export default function Topbar({ title }: { title: string }) {
  const { profile } = useBusiness();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);

  return (
    <div className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {profile?.businessName && (
          <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {profile.businessName}
          </span>
        )}
      </div>
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}