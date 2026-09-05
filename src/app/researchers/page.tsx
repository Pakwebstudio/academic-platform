import { db } from "@/lib/db";
import { ResearcherCard } from "@/components/ui/researcher-card";
import { EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import type { Prisma } from "@prisma/client";

export default async function ResearchersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const perPage = 12;

  const where: Prisma.UserWhereInput = {
    role: { in: ["TEACHER", "RESEARCHER"] },
    status: "ACTIVE",
  };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { designation: { contains: q } },
    ];
  }

  const [researchers, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        researcherProfile: { include: { university: true } },
        researchInterests: { include: { researchArea: true } },
      },
      orderBy: [{ researcherProfile: { publications: "desc" } }, { name: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Researchers</h1>
        <p className="mt-1 text-slate-500">Find academic professionals and researchers</p>
      </div>

      <form method="get" className="mb-6 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search researchers by name, field, university..."
          className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm focus:outline-2 focus:outline-primary"
        />
        <button type="submit" className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-600">
          Search
        </button>
      </form>

      {researchers.length === 0 ? (
        <EmptyState title="No researchers found" description="Try adjusting your search." />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{total} researcher{total !== 1 ? "s" : ""}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {researchers.map((r) => (
              <ResearcherCard key={r.id} researcher={r} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} />
          </div>
        </>
      )}
    </div>
  );
}
