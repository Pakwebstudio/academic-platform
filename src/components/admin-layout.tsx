"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import type { Role } from "@/lib/db-types";

const adminLinks: { href: string; label: string; icon: string }[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/papers", label: "Research Papers", icon: "📄" },
  { href: "/admin/papers/pending", label: "Paper Approvals", icon: "✅" },
  { href: "/admin/permission-requests", label: "Permission Requests", icon: "🔑" },
  { href: "/admin/universities", label: "Universities", icon: "🏛️" },
  { href: "/admin/research-areas", label: "Research Areas", icon: "🔬" },
  { href: "/admin/verification", label: "Verification", icon: "✔️" },
  { href: "/admin/reports", label: "Reports", icon: "🚨" },
  { href: "/admin/transactions", label: "Transactions", icon: "💰" },
  { href: "/admin/call-requests", label: "Call Requests", icon: "📞" },
  { href: "/admin/collaborations", label: "Collaborations", icon: "🤝" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "📋" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  adminRole?: string | null;
  avatarUrl?: string | null;
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user || d.user.role !== "ADMIN") {
          router.push("/login");
          return;
        }
        setUser(d.user);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white overflow-y-auto lg:static lg:z-auto lg:w-56 flex-shrink-0",
        sidebarOpen ? "block" : "hidden lg:block"
      )}>
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-red-400">Admin Panel</span>
          </div>
        </div>
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.adminRole || "SUPER_ADMIN"}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-red-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 mt-auto border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 bg-slate-50 p-6">
        {children}
      </div>
    </div>
  );
}
