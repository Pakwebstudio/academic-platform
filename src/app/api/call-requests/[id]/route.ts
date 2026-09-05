import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, notFound, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const req = await db.callRequest.findUnique({ where: { id } });
  if (!req) return notFound("Request not found");

  // Only the researcher can accept/decline
  if (req.researcherId !== user.id) return forbidden("Only the researcher can respond.");

  const body = await request.json();
  const { status } = body;
  const valid = ["SCHEDULED", "COMPLETED", "CANCELLED", "DECLINED"];
  if (!valid.includes(status)) return error("Invalid status", 422);

  await db.callRequest.update({ where: { id }, data: { status } });

  await auditLog({
    actorId: user.id, action: "UPDATE_CALL_REQUEST", entityType: "CallRequest", entityId: id,
    after: { status },
  });

  return success({ message: "Updated" });
}
