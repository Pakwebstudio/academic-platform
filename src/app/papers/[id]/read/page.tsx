import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PaperReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const paper = await db.researchPaper.findUnique({
    where: { id },
    include: {
      accessRecords: true,
      fileAsset: true,
      authors: true,
    },
  });
  if (!paper || paper.status !== "APPROVED") notFound();
  if (!user) redirect("/login");

  // Determine access
  const hasAccessRecord = paper.accessRecords.some(
    (rec) => rec.userId === user.id && !rec.revokedAt
  );
  const isUploader = paper.uploaderId === user.id;
  const isAuthor = paper.authors.some((a) => a.userId === user.id);
  const isFree = paper.accessType === "FREE";
  const hasAccess = isFree || hasAccessRecord || isUploader || isAuthor;

  if (!hasAccess || !paper.fileAsset) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/dashboard/purchases" className="hover:text-slate-700">My Purchases</Link>
            <span>/</span>
            <span className="truncate">{paper.title}</span>
          </nav>
          <h1 className="text-xl font-bold text-slate-900 truncate">{paper.title}</h1>
        </div>
        <Badge variant={paper.accessType === "FREE" ? "success" : "primary"}>
          {paper.accessType === "FREE" ? "Free Access" : "Purchased"}
        </Badge>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <iframe
          src={`/api/papers/${paper.id}/access`}
          className="h-[80vh] w-full"
          title={paper.title}
        />
      </div>

      <p className="mt-4 text-xs text-slate-400 text-center">
        {isUploader || isAuthor
          ? "You are viewing because you are the author/uploader of this paper."
          : isFree
          ? "This paper is free to access."
          : "You have an active purchase for this paper."}
      </p>

      <div className="mt-4 text-center">
        <Link href="/dashboard/purchases">
          <Button variant="outline">Back to Purchases</Button>
        </Link>
      </div>
    </div>
  );
}
