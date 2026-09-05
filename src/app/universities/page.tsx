import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export default async function UniversitiesPage() {
  const universities = await db.university.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { papers: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Universities</h1>
        <p className="mt-1 text-slate-500">Browse academic institutions on Acadexa</p>
      </div>

      {universities.length === 0 ? (
        <EmptyState title="No universities yet" description="Universities will appear here once registered." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <Link
              key={u.id}
              href={`/universities/${u.slug}`}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-primary font-bold text-lg flex-shrink-0">
                {u.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">{u.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {u.city && u.country ? `${u.city}, ${u.country}` : u.country || "Academic Institution"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {u.verified && <Badge variant="success" className="text-xs">Verified</Badge>}
                  <span className="text-xs text-slate-400">{u._count.papers} papers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
