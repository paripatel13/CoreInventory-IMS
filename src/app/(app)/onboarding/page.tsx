"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useBusiness } from "../../../context/BusinessContext";
import { useAuth } from "../../../context/AuthContext";
import { Button, Input, Label } from "../../../components/ui/index";
import {
  Building2, Users, Warehouse, Package,
  ChevronRight, ChevronLeft, CheckCircle2
} from "lucide-react";
import { ROUTES } from "../../../constants/routes";

const INDUSTRIES = [
  "Manufacturing", "Retail", "Wholesale / Distribution",
  "Food & Beverage", "Pharmaceuticals", "Construction",
  "Automotive", "Electronics", "Textiles", "Other",
];

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2, desc: "Tell us about your business" },
  { id: 2, title: "Team Size", icon: Users, desc: "How big is your team?" },
  { id: 3, title: "Operations", icon: Warehouse, desc: "Your warehouses & products" },
  { id: 4, title: "Ready!", icon: CheckCircle2, desc: "You're all set" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateProfile } = useBusiness();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    ownerName: user?.displayName ?? "",
    industry: "",
    employeeCount: "",
    warehouseCount: "",
    productCount: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleFinish() {
    setLoading(true);
    try {
      await updateProfile({
        businessName: form.businessName,
        ownerName: form.ownerName,
        industry: form.industry,
        employeeCount: Number(form.employeeCount),
        warehouseCount: Number(form.warehouseCount),
        productCount: Number(form.productCount),
        onboardingComplete: true,
        theme: "light",
        currency: "INR",
        timezone: "Asia/Kolkata",
      });
      toast.success(`Welcome to CoreInventory, ${form.businessName}!`);
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canNext = () => {
    if (step === 1) return form.businessName.trim() && form.ownerName.trim() && form.industry;
    if (step === 2) return form.employeeCount !== "";
    if (step === 3) return form.warehouseCount !== "" && form.productCount !== "";
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 dark:bg-white rounded-xl mb-3">
            <Package className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">CoreInventory</h1>
          <p className="text-sm text-slate-500 mt-1">Lets set up your workspace</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id
                  ? "bg-green-500 text-white"
                  : step === s.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400"
              }`}>
                {step > s.id ? "✓" : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 transition-all ${step > s.id ? "bg-green-400" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg p-8">
          <AnimatePresence mode="wait">

            {/* Step 1 — Business Info */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Business Info</h2>
                    <p className="text-xs text-slate-500">Tell us about your business</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input placeholder="e.g. Thakkar Industries" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Your Name</Label>
                  <Input placeholder="e.g. Nehan Shah" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <select
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                  >
                    <option value="">Select your industry</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Team Size */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Team Size</h2>
                    <p className="text-xs text-slate-500">Helps us tailor the experience</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {["1-5", "6-20", "21-50", "51-100", "101-500", "500+"].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => set("employeeCount", range)}
                      className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.employeeCount === range
                          ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center">employees</p>
              </motion.div>
            )}

            {/* Step 3 — Operations */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operations Scale</h2>
                    <p className="text-xs text-slate-500">Approximate numbers are fine</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>How many warehouses / storage locations?</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1", "2-5", "6-10", "10+"].map((n) => (
                      <button key={n} type="button" onClick={() => set("warehouseCount", n)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.warehouseCount === n
                            ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Approximate number of product SKUs?</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["<50", "50-200", "200-1k", "1k+"].map((n) => (
                      <button key={n} type="button" onClick={() => set("productCount", n)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.productCount === n
                            ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Ready */}
            {step === 4 && (
              <motion.div key="step4"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    You are all set, {form.ownerName.split(" ")[0]}!
                  </h2>
                  <p className="text-slate-500 mt-2 text-sm">
                    {form.businessName} is ready to manage inventory like a pro.
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left space-y-2">
                  {[
                    { label: "Business", value: form.businessName },
                    { label: "Industry", value: form.industry },
                    { label: "Team", value: `${form.employeeCount} employees` },
                    { label: "Warehouses", value: form.warehouseCount },
                    { label: "SKUs", value: form.productCount },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            {step < 3 && (
              <Button
                className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 gap-1"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {step === 3 && (
              <Button
                className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 gap-1"
                onClick={() => setStep(4)}
                disabled={!canNext()}
              >
                Review Setup <ChevronRight className="w-4 h-4" />
              </Button>
            )}
            {step === 4 && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? "Setting up..." : "🚀 Launch Dashboard"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}