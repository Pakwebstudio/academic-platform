import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const reports = await db.report.findMany({
    include: {
      reporter: { select: { id: true, name: true } },
      reportedUser: { select: { id: true, name: true } },
      paper: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return success({ reports });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { reportId, status, notes } = body;
  if (!reportId || !status) return error("Report ID and status required", 422);

  await db.report.update({
    where: { id: reportId },
    data: { status, resolutionNotes: notes, assignedTo: viewer.id },
  });

  await auditLog({
    actorId: viewer.id, action: "UPDATE_REPORT", entityType: "Report", entityId: reportId,
    after: { status },
  });

  return success({ message: "Report updated" });
}
