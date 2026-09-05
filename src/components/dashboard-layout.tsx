"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import type { Role } from "@prisma/client";

const dashboardLinks: { href: string; label: string; icon: string }[] = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/papers", label: "My Papers", icon: "📄" },
  { href: "/dashboard/publish", label: "Publish Paper", icon: "✏️" },
  { href: "/dashboard/requests", label: "Paper Requests", icon: "📥" },
  { href: "/dashboard/purchases", label: "My Purchases", icon: "🛒" },
  { href: "/dashboard/messages", label: "Messages", icon: "💬" },
  { href: "/dashboard/call-requests", label: "Call Requests", icon: "📞" },
  { href: "/dashboard/collaborations", label: "Collaborations", icon: "🤝" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user) {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex gap-6">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 right-4 z-50 lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-0 z-40 lg:static lg:z-auto lg:block",
            sidebarOpen ? "block" : "hidden lg:block"
          )}
        >
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 overflow-y-auto lg:static lg:z-auto lg:w-56 lg:flex-shrink-0",
            sidebarOpen ? "block" : "hidden lg:block"
          )}>
            {/* User info */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-0.5">
              {dashboardLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-indigo-50 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
