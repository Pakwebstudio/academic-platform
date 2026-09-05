import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { error, notFound, forbidden } from "@/lib/api";
import { storageService } from "@/lib/storage";
import type { DbRow } from "@/lib/db-types";

// Secure paper file access. Requires the requesting user to have an active PaperAccess record.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const paper = await db.researchPaper.findUnique({
    where: { id },
    include: { accessRecords: true, fileAsset: true, authors: true },
  });
  if (!paper) return notFound("Paper not found");

  // Access rules: free papers with uploader authorization, or a purchased access record
  const hasAccessRecord = paper.accessRecords.some(
    (rec: DbRow) => rec.userId === user.id && !rec.revokedAt
  );
  const isUploader = paper.uploaderId === user.id;
  const isAuthor = paper.authors?.some((a: DbRow) => a.userId === user.id);

  const isFree = paper.accessType === "FREE" && paper.status === "APPROVED";

  if (!isFree && !hasAccessRecord && !isUploader && !isAuthor) {
    return forbidden("You do not have access to this paper.");
  }

  if (!paper.fileAsset) {
    return notFound("No file available for this paper");
  }

  const file = await storageService.getFile(paper.fileAssetId!);
  if (!file) return notFound("File not found");

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType || "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(paper.title)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
