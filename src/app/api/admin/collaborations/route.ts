import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import type { CollaborationStatus } from "@/lib/db-types";

export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: { status?: CollaborationStatus } = {};
  if (status) where.status = status as CollaborationStatus;

  const collaborations = await db.researchCollaboration.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { requests: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return success({ collaborations });
}