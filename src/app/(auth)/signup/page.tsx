"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signUp } from "../../../lib/firebase/auth";
 import { Button, Input, Label, Badge, Avatar, AvatarFallback } from "../../../components/ui/index";
import { ROUTES } from "../../../constants/routes";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success("Account created!");
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error("Could not create account. Try again.");
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
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="text-slate-500 text-sm mt-1">Start managing your inventory today</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="John Doe"
            value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Min. 6 characters"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-700" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-slate-500 text-center">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="text-slate-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
