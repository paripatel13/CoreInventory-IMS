"use client";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { logOut } from "../../../lib/firebase/auth";
import { toast } from "sonner";
import Topbar from "../../../components/layout/Topbar";
// import { Button } from "../../../components/ui/button";
// import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { ROUTES } from "../../../constants/routes";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const initials = user?.displayName?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "U";

  async function handleLogout() {
    await logOut();
    toast.success("Logged out!");
    router.push(ROUTES.LOGIN);
  }

  return (
    <div className="flex-1">
      <Topbar title="Profile" />
      <div className="p-6 max-w-md">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-100 p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-5">
            {/* <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-slate-900 text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar> */}
            <div>
              <p className="text-xl font-bold text-slate-900">{user?.displayName ?? "User"}</p>
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">
            {[
              { label: "Display Name", value: user?.displayName ?? "—" },
              { label: "Email", value: user?.email ?? "—" },
                    { label: "Account ID", value: (user?.uid ? user.uid.slice(0, 12) + "..." : "—") },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                <span className="text-sm text-slate-900 font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Logout
          </Button> */}
        </motion.div>
      </div>
    </div>
  );
}
