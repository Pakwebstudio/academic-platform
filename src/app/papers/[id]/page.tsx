import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PurchaseButton } from "@/components/purchase-button";

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let paper;
  try {
    paper = await db.researchPaper.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        authors: { select: { name: true, email: true, affiliation: true, isPrimary: true, user: { select: { id: true, avatarUrl: true, name: true } } } },
        university: { select: { name: true, slug: true } },
        category: { select: { name: true } },
        researchAreas: { include: { researchArea: true } },
        _count: { select: { purchases: true, accessRecords: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!paper || paper.status !== "APPROVED") notFound();

  // Increment views
  await db.researchPaper.update({
    where: { id: paper.id },
    data: { views: { increment: 1 } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/papers" className="hover:text-slate-700">Papers</Link>
        <span>/</span>
        <span className="text-slate-900 truncate">{paper.title}</span>
      </nav>

      <article>
        {/* Title and access */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {paper.title}
          </h1>
          <Badge variant={paper.accessType === "FREE" ? "success" : paper.accessType === "PAID" ? "warning" : "outline"}>
            {paper.accessType === "FREE" ? "Free Access" : paper.accessType === "PAID" ? formatCurrency(paper.price, paper.currency) : "External Link"}
          </Badge>
        </div>

        {/* Authors */}
        {paper.authors.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex -space-x-3">
              {paper.authors.map((a, i) => (
                <Avatar key={i} src={a.user?.avatarUrl} name={a.name} size="sm" className="ring-2 ring-white" />
              ))}
            </div>
            <div className="text-sm text-slate-600">
              {paper.authors.map((a, i) => (
                <span key={i}>
                  {a.user ? (
                    <Link href={`/researchers/${a.user.id}`} className="font-medium text-primary hover:underline">{a.name}</Link>
                  ) : (
                    <span className="font-medium">{a.name}</span>
                  )}
                  {a.affiliation ? <span className="text-slate-400"> · {a.affiliation}</span> : ""}
                  {i < paper.authors.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-slate-500">
          {paper.researchField && <Badge variant="primary">{paper.researchField}</Badge>}
          {paper.university && <Badge>{paper.university.name}</Badge>}
          {paper.publicationDate && <span>Published {formatDate(paper.publicationDate)}</span>}
          {paper.doi && <span>DOI: {paper.doi}</span>}
          <span>{paper.views.toLocaleString()} views</span>
          <span>{paper._count.purchases} purchases</span>
        </div>

        {/* Research areas */}
        {paper.researchAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {paper.researchAreas.map((ra) => (
              <Link key={ra.researchArea.id} href={`/papers?area=${ra.researchArea.slug}`}>
                <Badge variant="outline">{ra.researchArea.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Publication info */}
        {(paper.journal || paper.conference || paper.publisher || paper.volume || paper.issue || paper.pages) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Publication Details</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {paper.journal && <><dt className="text-slate-500">Journal</dt><dd className="text-slate-900">{paper.journal}</dd></>}
              {paper.conference && <><dt className="text-slate-500">Conference</dt><dd className="text-slate-900">{paper.conference}</dd></>}
              {paper.publisher && <><dt className="text-slate-500">Publisher</dt><dd className="text-slate-900">{paper.publisher}</dd></>}
              {paper.volume && <><dt className="text-slate-500">Volume</dt><dd className="text-slate-900">{paper.volume}</dd></>}
              {paper.issue && <><dt className="text-slate-500">Issue</dt><dd className="text-slate-900">{paper.issue}</dd></>}
              {paper.pages && <><dt className="text-slate-500">Pages</dt><dd className="text-slate-900">{paper.pages}</dd></>}
              {paper.doi && <><dt className="text-slate-500">DOI</dt><dd className="text-slate-900">{paper.doi}</dd></>}
            </dl>
          </div>
        )}

        {/* Abstract */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Abstract</h2>
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
            {paper.abstract}
          </div>
        </div>

        {/* Keywords */}
        {paper.keywords && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {JSON.parse(paper.keywords).map((kw: string) => (
                <Badge key={kw} variant="outline">{kw}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Access This Paper</h3>
          {paper.accessType === "EXTERNAL_LINK" && paper.externalUrl ? (
            <a href={paper.externalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">View on Publisher Site</Button>
            </a>
          ) : paper.accessType === "FREE" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">This paper is available for free access.</p>
              <Link href={`/papers/${paper.id}/read`}>
                <Button variant="success">Read Paper</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {paper.needsPermission && !paper.isAuthorized ? (
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  Author permission required for this paper. It cannot be purchased yet.
                </div>
              ) : (
                <PurchaseButton paperId={paper.id} price={paper.price} currency={paper.currency} />
              )}
              <Link
                href={paper.authors[0]?.user ? `/dashboard/messages` : "#"}
                className="inline-block"
              >
                <Button variant="outline">Contact Author</Button>
              </Link>
            </div>
          )}

          {paper.licenseType && (
            <p className="mt-4 text-xs text-slate-400">
              License: {paper.licenseType}
            </p>
          )}
        </div>
      </article>
    </div>
  );
}
