"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signIn, signUp } from "../../../lib/firebase/auth";
 import { Button, Input, Label, Badge, Avatar, AvatarFallback } from "../../../components/ui/index";
import { ROUTES } from "../../../constants/routes";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link href={ROUTES.RESET_PASSWORD} className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-700" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-sm text-slate-500 text-center">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGNUP} className="text-slate-900 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
