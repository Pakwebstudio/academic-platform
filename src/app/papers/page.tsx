import { db } from "@/lib/db";
import { PaperCard } from "@/components/ui/paper-card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/feedback";
import type { Prisma } from "@/lib/db-types";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const area = params.area || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const perPage = 12;

  const where: Prisma.ResearchPaperWhereInput = { status: "APPROVED" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { abstract: { contains: q } },
      { keywords: { contains: q } },
    ];
  }
  if (area) {
    where.researchAreas = { some: { researchArea: { slug: area } } };
  }

  const [papers, total] = await Promise.all([
    db.researchPaper.findMany({
      where,
      include: {
        authors: { select: { name: true, user: { select: { id: true, avatarUrl: true } } } },
        university: { select: { name: true } },
        researchAreas: { include: { researchArea: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.researchPaper.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Research Papers</h1>
        <p className="mt-1 text-slate-500">Discover published research across disciplines</p>
      </div>

      {/* Filters */}
      <form method="get" className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search papers by title, abstract, keywords..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-2 focus:outline-primary"
          />
        </div>
        {area && <input type="hidden" name="area" value={area} />}
        <button
          type="submit"
          className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-600"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {papers.length === 0 ? (
        <EmptyState
          title="No papers found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-500">{total} paper{total !== 1 ? "s" : ""} found</div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p: any) => {
              const card = { ...p, researchField: p.researchAreas[0]?.researchArea.name };
              return (
                <PaperCard
                  key={p.id}
                  paper={card}
                />
              );
            })}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} />
          </div>
        </>
      )}
    </div>
  );
}
