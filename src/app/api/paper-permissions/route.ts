import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

// Create permission request / Get requests for author
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const requests = await db.paperPermissionRequest.findMany({
    where: { authorUserId: user.id },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      paper: { select: { id: true, title: true, slug: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({ requests });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { paperId, authorUserId, authorName, reason, proposedPrice, revenueSplit, requestedPermission } = body;

  if (!paperId || !authorName) return error("Paper and author are required.", 422);

  const paper = await db.researchPaper.findUnique({ where: { id: paperId } });
  if (!paper) return error("Paper not found", 404);

  const permissionRequest = await db.paperPermissionRequest.create({
    data: {
      requesterId: user.id,
      paperId,
      authorUserId,
      authorName,
      reason,
      proposedPrice: proposedPrice ? parseFloat(proposedPrice) : undefined,
      revenueSplit: revenueSplit ? parseFloat(revenueSplit) : undefined,
      requestedPermission: requestedPermission || "SELL",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Notify the author (rights holder)
  if (authorUserId && authorUserId !== user.id) {
    await createNotification({
      userId: authorUserId,
      type: "PERMISSION_REQUEST",
      title: "Paper Sales Permission Request",
      message: `${user.name} wants to ${requestedPermission || "sell"} "${paper.title}"`,
      link: "/dashboard/requests",
    });
  }

  return success({ permissionRequest }, 201);
}
