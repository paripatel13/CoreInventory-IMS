"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../lib/firebase/config";
import { Button, Input, Label } from "../../../components/ui/index";
import { ROUTES } from "../../../constants/routes";
import { Phone, KeyRound, Lock, CheckCircle2 } from "lucide-react";

type Step = "phone" | "otp" | "newpassword" | "done";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.startsWith("+")) {
      toast.error("Include country code e.g. +91XXXXXXXXXX");
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(result);
      setStep("otp");
      setTimer(30);
      toast.success("OTP sent to " + phone);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(msg.includes("invalid-phone") ? "Invalid phone number." : "Failed to send OTP. Try again.");
      window.recaptchaVerifier?.clear?.();
      (window.recaptchaVerifier as unknown) = undefined;
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits."); return; }
    if (!confirmation) return;
    setLoading(true);
    try {
      await confirmation.confirm(code);
      setStep("newpassword");
      toast.success("Phone verified!");
    } catch {
      toast.error("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      window.recaptchaVerifier?.clear?.();
      (window.recaptchaVerifier as unknown) = undefined;
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmation(result);
      setTimer(30);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP resent!");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) { toast.error("Session expired. Please try again."); return; }
      await updatePassword(user, newPassword);
      setStep("done");
      toast.success("Password updated successfully!");
    } catch {
      toast.error("Failed to update password. Please re-login and try again.");
    } finally {
      setLoading(false);
    }
  }

  const STEPS = ["phone", "otp", "newpassword", "done"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm space-y-6"
    >
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {[Phone, KeyRound, Lock, CheckCircle2].map((Icon, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              i < stepIndex
                ? "bg-green-500 text-white"
                : i === stepIndex
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            {i < 3 && <div className={`w-6 h-0.5 ${i < stepIndex ? "bg-green-400" : "bg-slate-200 dark:bg-slate-700"}`} />}
          </div>
        ))}
      </div>

      <div id="recaptcha-container" />

      <AnimatePresence mode="wait">

        {/* Step 1 — Phone */}
        {step === "phone" && (
          <motion.div key="phone"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Enter your phone number to receive an OTP
              </p>
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-400">Include country code (+91 for India)</p>
              </div>
              <Button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP →"}
              </Button>
            </form>
          </motion.div>
        )}

        {/* Step 2 — OTP */}
        {step === "otp" && (
          <motion.div key="otp"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enter OTP</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                6-digit code sent to <strong>{phone}</strong>
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* OTP Boxes */}
              <div className="flex gap-2 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 focus:border-slate-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <Button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP →"}
              </Button>

              {/* Resend */}
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-xs text-slate-400">Resend in {timer}s</p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button type="button" onClick={() => setStep("phone")}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors">
                ← Change phone number
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 3 — New Password */}
        {step === "newpassword" && (
          <motion.div key="newpassword"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Set your new password
              </p>
            </div>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newpass">New Password</Label>
                <Input
                  id="newpass"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmpass">Confirm Password</Label>
                <Input
                  id="confirmpass"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              <Button
                type="submit"
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700"
                disabled={loading || (newPassword !== confirmPassword)}
              >
                {loading ? "Updating..." : "Set New Password →"}
              </Button>
            </form>
          </motion.div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 py-4"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password Updated!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                You can now sign in with your new password.
              </p>
            </div>
            <Button
              className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700"
              onClick={() => router.push(ROUTES.LOGIN)}
            >
              Go to Sign In
            </Button>
          </motion.div>
        )}

      </AnimatePresence>

      {step === "phone" && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Remember your password?{" "}
          <Link href={ROUTES.LOGIN} className="text-slate-900 dark:text-white font-medium hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </motion.div>
  );
}