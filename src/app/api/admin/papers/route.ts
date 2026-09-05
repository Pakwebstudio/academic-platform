import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = 20;

  const where: Prisma.ResearchPaperWhereInput = status
  ? { status: status as Prisma.ResearchPaperWhereInput["status"] }
  : {};

  const [papers, total] = await Promise.all([
    db.researchPaper.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true, email: true } },
        authors: { select: { name: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.researchPaper.count({ where }),
  ]);

  return success({ papers, total, page, totalPages: Math.ceil(total / perPage) });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { paperId, action, reason } = body;
  if (!paperId) return error("Paper ID required", 422);

  const paper = await db.researchPaper.findUnique({ where: { id: paperId } });
  if (!paper) return error("Paper not found", 404);

  let status = paper.status;
  let rejectionReason = paper.rejectionReason;

  switch (action) {
    case "approve":
      status = "APPROVED";
      break;
    case "reject":
      if (!reason) return error("A reason is required to reject a paper.", 422);
      status = "REJECTED";
      rejectionReason = reason;
      break;
    case "changes":
      if (!reason) return error("A reason is required to request changes.", 422);
      status = "REQUEST_CHANGES";
      rejectionReason = reason;
      break;
    case "suspend":
      status = "SUSPENDED";
      break;
    case "restore":
      status = "APPROVED";
      break;
    case "remove":
      status = "REMOVED";
      break;
    default:
      return error("Unknown action", 400);
  }

  await db.researchPaper.update({
    where: { id: paperId },
    data: { status, rejectionReason },
  });

  await auditLog({
    actorId: viewer.id,
    action: `PAPER_${action.toUpperCase()}`,
    entityType: "ResearchPaper",
    entityId: paperId,
    before: { status: paper.status },
    after: { status },
  });

  // Notify uploader
  await db.notification.create({
    data: {
      userId: paper.uploaderId,
      type: "PAPER_STATUS",
      title: `Paper ${action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Updated"}`,
      message: `"${paper.title}" was ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"}${reason ? `: ${reason}` : ""}.`,
      link: `/dashboard/papers`,
    },
  });

  return success({ message: "Paper updated", status });
}
