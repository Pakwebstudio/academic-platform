import Link from "next/link";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/admin-layout";

export default async function AdminDashboardPage() {
  let stats = {
    users: 0, teachers: 0, researchers: 0, students: 0,
    universities: 0, departments: 0,
    papers: 0, pendingPapers: 0, approvedPapers: 0, rejectedPapers: 0,
    permissionRequests: 0, purchases: 0, revenue: 0,
    callRequests: 0, collaborations: 0, reports: 0,
  };

  try {
    const [
      users, teachers, researchers, students,
      universities, departments,
      papers, pendingPapers, approvedPapers, rejectedPapers,
      permissionRequests, purchases, callRequests, collaborations, reports,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "TEACHER" } }),
      db.user.count({ where: { role: "RESEARCHER" } }),
      db.user.count({ where: { role: "STUDENT" } }),
      db.university.count(),
      db.department.count(),
      db.researchPaper.count(),
      db.researchPaper.count({ where: { status: "PENDING_REVIEW" } }),
      db.researchPaper.count({ where: { status: "APPROVED" } }),
      db.researchPaper.count({ where: { status: "REJECTED" } }),
      db.paperPermissionRequest.count(),
      db.paperPurchase.count(),
      db.callRequest.count(),
      db.researchCollaboration.count(),
      db.report.count(),
    ]);

    const revenueAgg = await db.paperPurchase.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESSFUL" },
    });

    stats = {
      users, teachers, researchers, students,
      universities, departments,
      papers, pendingPapers, approvedPapers, rejectedPapers,
      permissionRequests, purchases, revenue: revenueAgg._sum.amount || 0,
      callRequests, collaborations, reports,
    };
  } catch (e) {
    console.error("Admin dashboard error:", e);
  }

  const statCards = [
    { label: "Total Users", value: stats.users, href: "/admin/users", color: "bg-indigo-50 text-indigo-700" },
    { label: "Teachers / Professors", value: stats.teachers, href: "/admin/users?role=TEACHER", color: "bg-violet-50 text-violet-700" },
    { label: "Researchers", value: stats.researchers, href: "/admin/users?role=RESEARCHER", color: "bg-sky-50 text-sky-700" },
    { label: "Students", value: stats.students, href: "/admin/users?role=STUDENT", color: "bg-amber-50 text-amber-700" },
    { label: "Universities", value: stats.universities, href: "/admin/universities", color: "bg-emerald-50 text-emerald-700" },
    { label: "Departments", value: stats.departments, href: "/admin/universities", color: "bg-teal-50 text-teal-700" },
    { label: "Total Papers", value: stats.papers, href: "/admin/papers", color: "bg-rose-50 text-rose-700" },
    { label: "Pending Papers", value: stats.pendingPapers, href: "/admin/papers/pending", color: "bg-orange-50 text-orange-700" },
    { label: "Approved Papers", value: stats.approvedPapers, href: "/admin/papers", color: "bg-green-50 text-green-700" },
    { label: "Permission Requests", value: stats.permissionRequests, href: "/admin/permission-requests", color: "bg-blue-50 text-blue-700" },
    { label: "Purchases", value: stats.purchases, href: "/admin/transactions", color: "bg-purple-50 text-purple-700" },
    { label: "Reports", value: stats.reports, href: "/admin/reports", color: "bg-red-50 text-red-700" },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Revenue Highlight */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
          <p className="text-sm text-slate-400">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">
            {new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(stats.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-sm text-slate-500">Quick Actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/papers/pending" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-600">Review Papers</Link>
            <Link href="/admin/verification" className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">Verification Queue</Link>
            <Link href="/admin/permission-requests" className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">Permission Requests</Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <p className={`inline-flex rounded-lg px-2 py-1 text-xs font-medium ${card.color}`}>{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
