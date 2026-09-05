import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const requests = await db.verificationRequest.findMany({
    where: { status: { in: ["PENDING", "VERIFIED", "REJECTED"] } },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return success({ requests });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { requestId, verify, message } = body;
  if (!requestId) return error("Request ID required", 422);

  const req = await db.verificationRequest.findUnique({ where: { id: requestId } });
  if (!req) return error("Request not found", 404);

  const status = verify ? "VERIFIED" : "REJECTED";

  await db.verificationRequest.update({
    where: { id: requestId },
    data: { status, adminMessage: message, decidedBy: viewer.id, decidedAt: new Date() },
  });

  await db.user.update({
    where: { id: req.userId },
    data: { verificationStatus: status },
  });

  const rp = await db.researcherProfile.findUnique({ where: { userId: req.userId } });
  if (rp) {
    await db.researcherProfile.update({
      where: { userId: req.userId },
      data: { verified: !!verify },
    });
  }

  await auditLog({
    actorId: viewer.id,
    action: verify ? "VERIFY_USER" : "REJECT_VERIFICATION",
    entityType: "VerificationRequest",
    entityId: requestId,
    after: { status },
  });

  await db.notification.create({
    data: {
      userId: req.userId,
      type: "VERIFICATION",
      title: `Verification ${status === "VERIFIED" ? "Approved" : "Rejected"}`,
      message: message || (status === "VERIFIED" ? "Your profile has been verified." : "Your verification request was not approved."),
      link: "/dashboard/profile",
    },
  });

  return success({ message: "Verification updated" });
}
