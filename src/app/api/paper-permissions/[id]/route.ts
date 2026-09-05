import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";

// Handle approval/rejection of permission requests
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { requestId, action, message } = body;
  if (!requestId) return error("Request ID required", 422);

  const permission = await db.paperPermissionRequest.findUnique({
    where: { id: requestId },
    include: { paper: true, requester: true },
  });
  if (!permission) return error("Request not found", 404);

  // Only the author (rights holder) can decide
  if (permission.authorUserId !== user.id) {
    return forbidden("Only the paper author can respond to this request.");
  }

  let status: "APPROVED" | "REJECTED" = "APPROVED";
  switch (action) {
    case "approve":
      status = "APPROVED";
      // Mark paper as authorized for sale
      await db.researchPaper.update({
        where: { id: permission.paperId },
        data: { isAuthorized: true, needsPermission: false },
      });
      break;
    case "reject":
      status = "REJECTED";
      break;
    default:
      return error("Unknown action", 400);
  }

  await db.paperPermissionRequest.update({
    where: { id: requestId },
    data: { status, responseMessage: message, decidedBy: user.id, decidedAt: new Date() },
  });

  await auditLog({
    actorId: user.id,
    action: `PERMISSION_${status}`,
    entityType: "PaperPermissionRequest",
    entityId: requestId,
  });

  // Notify requester
  await createNotification({
    userId: permission.requesterId,
    type: "PERMISSION_DECISION",
    title: `Permission ${status === "APPROVED" ? "Approved" : "Rejected"}`,
    message: `Your request to sell "${permission.paper.title}" was ${status === "APPROVED" ? "approved" : "rejected"}${message ? `: ${message}` : ""}.`,
    link: "/dashboard/papers",
  });

  return success({ message: `Permission ${status.toLowerCase()}` });
}
