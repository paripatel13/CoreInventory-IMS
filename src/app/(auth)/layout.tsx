export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12">
        <div className="text-white text-2xl font-bold tracking-tight">
          ◈ CoreInventory
        </div>
        <div>
          <p className="text-slate-300 text-3xl font-semibold leading-snug">
            Real-time stock control,<br />zero guesswork.
          </p>
          <p className="text-slate-500 mt-3 text-sm">Manage receipts, deliveries, transfers & adjustments — all in one place.</p>
        </div>
        <p className="text-slate-600 text-xs">© 2026 CoreInventory</p>
      </div>
      <div className="flex items-center justify-center p-8 bg-white">
        {children}
      </div>
    </div>
  );
}
