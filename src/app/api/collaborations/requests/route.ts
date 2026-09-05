import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, notFound, forbidden } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { collaborationId, message } = body;
  if (!collaborationId) return error("Collaboration required", 422);

  const collaboration = await db.researchCollaboration.findUnique({ where: { id: collaborationId } });
  if (!collaboration) return notFound("Collaboration not found");
  if (collaboration.userId === user.id) return error("You own this collaboration", 400);
  if (collaboration.status === "CLOSED") return error("Collaboration is closed", 400);

  const request_ = await db.collaborationRequest.create({
    data: { collaborationId, requesterId: user.id, message },
  });

  await createNotification({
    userId: collaboration.userId,
    type: "COLLABORATION_REQUEST",
    title: "New collaboration request",
    message: `${user.name} wants to join "${collaboration.title}"`,
    link: "/dashboard/collaborations",
  });

  return success({ request: request_ }, 201);
}

// Respond to a join request (owner only), also can update collaboration status
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { requestId, action } = body;
  if (!requestId || !action) return error("Request and action required", 422);

  const collabReq = await db.collaborationRequest.findUnique({
    where: { id: requestId },
    include: { collaboration: true },
  });
  if (!collabReq) return notFound("Request not found");
  if (collabReq.collaboration.userId !== user.id)
    return forbidden("Only the collaboration owner can respond.");

  const status = action === "approve" ? "ACCEPTED" : action === "reject" ? "REJECTED" : null;
  if (!status) return error("Unknown action", 400);

  await db.collaborationRequest.update({ where: { id: requestId }, data: { status } });

  await auditLog({
    actorId: user.id, action: `COLLABORATION_${status}`, entityType: "CollaborationRequest", entityId: requestId,
  });

  await createNotification({
    userId: collabReq.requesterId,
    type: "COLLABORATION_DECISION",
    title: status === "ACCEPTED" ? "Collaboration accepted" : "Collaboration declined",
    message: `Your request to join "${collabReq.collaboration.title}" was ${status === "ACCEPTED" ? "accepted" : "declined"}.`,
    link: "/dashboard/collaborations",
  });

  return success({ message: status.toLowerCase() });
}
