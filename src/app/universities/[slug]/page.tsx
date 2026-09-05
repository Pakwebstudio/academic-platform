import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PaperCard } from "@/components/ui/paper-card";
import { ResearcherCard } from "@/components/ui/researcher-card";
import type { DbRow } from "@/lib/db-types";

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let university;
  try {
    university = await db.university.findUnique({
      where: { slug },
      include: {
        papers: {
          where: { status: "APPROVED" },
          include: {
            authors: { select: { name: true, user: { select: { id: true, avatarUrl: true } } } },
          },
          take: 6,
          orderBy: { createdAt: "desc" },
        },
        researchers: {
          include: {
            user: {
              include: {
                researcherProfile: true,
                researchInterests: { include: { researchArea: true } },
              },
            },
          },
          take: 6,
        },
      },
    });
  } catch {
    notFound();
  }

  if (!university) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start gap-6 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-100 text-primary font-bold text-2xl flex-shrink-0">
          {university.name[0]}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{university.name}</h1>
            {university.verified && <Badge variant="success">Verified</Badge>}
          </div>
          <p className="text-slate-500 mt-1">
            {[university.city, university.country].filter(Boolean).join(", ") || "Academic Institution"}
          </p>
          {university.description && (
            <p className="text-sm text-slate-600 mt-3 max-w-2xl">{university.description}</p>
          )}
          {university.website && (
            <a href={university.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
              Visit Website →
            </a>
          )}
        </div>
      </div>

      {/* Faculty */}
      {university.researchers.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Faculty & Researchers</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {university.researchers.map((rp: DbRow) => (
              <ResearcherCard key={rp.user.id} researcher={rp.user} />
            ))}
          </div>
        </section>
      )}

      {/* Publications */}
      {university.papers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Publications</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {university.papers.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (p: any) => (
              <PaperCard key={p.id} paper={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
