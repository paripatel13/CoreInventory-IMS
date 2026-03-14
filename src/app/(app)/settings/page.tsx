"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Building2, User, Globe, Bell } from "lucide-react";
import { useBusiness } from "../../../context/BusinessContext";
import { useAuth } from "../../../context/AuthContext";
import Topbar from "../../../components/layout/Topbar";
import { Button, Input, Label } from "../../../components/ui/index";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];
const TIMEZONES = ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Dubai", "Asia/Singapore"];
const INDUSTRIES = [
  "Manufacturing", "Retail", "Wholesale / Distribution",
  "Food & Beverage", "Pharmaceuticals", "Construction",
  "Automotive", "Electronics", "Textiles", "Other",
];

export default function SettingsPage() {
  const { profile, updateProfile } = useBusiness();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    industry: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName ?? "",
        ownerName: profile.ownerName ?? "",
        industry: profile.industry ?? "",
        currency: profile.currency ?? "INR",
        timezone: profile.timezone ?? "Asia/Kolkata",
      });
    }
  }, [profile]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const THEMES = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="flex-1">
      <Topbar title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* Business Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Business Profile</p>
              <p className="text-xs text-slate-400">Shown throughout the app</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Owner / Manager Name</Label>
                <Input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <select
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
              >
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <Button type="submit" className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</p>
              <p className="text-xs text-slate-400">Choose your preferred theme</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  theme === value
                    ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Regional */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Regional</p>
              <p className="text-xs text-slate-400">Currency and timezone</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <select
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <select
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              >
                {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <Button
            onClick={async () => {
              setSaving(true);
              await updateProfile({ currency: form.currency, timezone: form.timezone });
              toast.success("Regional settings saved!");
              setSaving(false);
            }}
            className="mt-4 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Regional"}
          </Button>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Account</p>
              <p className="text-xs text-slate-400">Signed in as {user?.email}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{user?.email}</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}