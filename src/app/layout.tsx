import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { BusinessProvider } from "../context/BusinessContext";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CoreInventory",
  description: "Modern Inventory Management System",
  icons: {
    icon: "/icon.jpeg",
    shortcut: "/icon.jpeg",
    apple: "/icon.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <BusinessProvider>
              {children}
              <Toaster richColors position="top-right" />
            </BusinessProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}