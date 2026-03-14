import ProtectedRoute from "../../components/layout/ProtectedRoute";
import Sidebar from "../../components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
