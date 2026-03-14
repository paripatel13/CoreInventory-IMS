"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, SlidersHorizontal, History, Settings,
  Warehouse, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import { ROUTES } from "../../constants/routes";
import { cn } from "../../lib/utils";

const NAV = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Products", href: ROUTES.PRODUCTS, icon: Package },
  { type: "section", label: "Operations" },
  { label: "Receipts", href: ROUTES.RECEIPTS, icon: ArrowDownToLine },
  { label: "Deliveries", href: ROUTES.DELIVERIES, icon: ArrowUpFromLine },
  { label: "Transfers", href: ROUTES.TRANSFERS, icon: ArrowLeftRight },
  { label: "Adjustments", href: ROUTES.ADJUSTMENTS, icon: SlidersHorizontal },
  { label: "History", href: ROUTES.HISTORY, icon: History },
  { type: "section", label: "Settings" },
  { label: "Warehouses", href: ROUTES.WAREHOUSES, icon: Warehouse },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { profile } = useBusiness();

  return (
    <div className="w-56 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col h-screen sticky top-0">

      {/* Logo + Business Name */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <Image
              src="/icon.jpeg"
              alt="App Icon"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {profile?.businessName ?? "CoreInventory"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {profile?.industry ?? "Inventory"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map((item, i) => {
          if ("type" in item) {
            return (
              <p
                key={i}
                className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-1"
              >
                {item.label}
              </p>
            );
          }
          const Icon = item.icon!;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
            {profile?.ownerName?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
            {profile?.ownerName ?? "User"}
          </p>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

    </div>
  );
}