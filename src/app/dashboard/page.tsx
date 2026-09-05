import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<string, "success" | "warning" | "danger" | "outline"> = {
  APPROVED: "success",
  PENDING_REVIEW: "warning",
  REJECTED: "danger",
  DRAFT: "outline",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [papers, viewsAgg, purchaseAgg, unreadAgg, conversationCount, recent] = await Promise.all([
    db.researchPaper.count({ where: { uploaderId: user.id } }),
    db.researchPaper.aggregate({
      where: { uploaderId: user.id },
      _sum: { views: true },
    }),
    db.paperPurchase.aggregate({
      where: { paper: { uploaderId: user.id }, status: "SUCCESSFUL" },
      _count: { _all: true },
      _sum: { sellerAmount: true },
    }),
    db.conversationMember.aggregate({
      where: { userId: user.id },
      _sum: { unreadCount: true },
    }),
    db.conversationMember.count({ where: { userId: user.id } }),
    db.researchPaper.findMany({
      where: { uploaderId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, status: true, views: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Publications", value: papers, href: "/dashboard/papers", color: "bg-indigo-50 text-indigo-700" },
    { label: "Paper Views", value: viewsAgg._sum.views || 0, href: "/dashboard/papers", color: "bg-emerald-50 text-emerald-700" },
    { label: "Purchases", value: purchaseAgg._count._all, href: "/dashboard/purchases", color: "bg-amber-50 text-amber-700" },
    { label: "Conversations", value: conversationCount, href: "/dashboard/messages", color: "bg-sky-50 text-sky-700" },
    { label: "Unread Messages", value: unreadAgg._sum.unreadCount || 0, href: "/dashboard/messages", color: "bg-rose-50 text-rose-700" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <Link href="/dashboard/publish" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            Publish Paper
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <p className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${stat.color}`}>{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Welcome back, {user.name.split(" ")[0]}!</h2>
            <span className="text-sm text-slate-500">Revenue from sales</span>
          </div>
          {purchaseAgg._count._all > 0 ? (
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(purchaseAgg._sum.sellerAmount || 0)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Publish approved papers and earn from sales. Track your papers, permissions and purchases below.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Papers</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">No papers yet. <Link href="/dashboard/publish" className="text-primary hover:underline">Publish your first paper</Link>.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link href={`/papers/${p.slug}`} className="text-slate-800 hover:text-primary">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[p.status] || "outline"}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.views}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}