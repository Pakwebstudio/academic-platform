import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

// List call requests (as researcher/requester)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const requests = await db.callRequest.findMany({
    where: { OR: [{ requesterId: user.id }, { researcherId: user.id }] },
    include: {
      requester: { select: { id: true, name: true, avatarUrl: true } },
      researcher: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({ requests });
}

// Create call request to a researcher
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { researcherId, phone, reason, preferredDate, preferredTime, message } = body;
  if (!researcherId || !phone || !reason) return error("Researcher, phone and reason required", 422);

  if (researcherId === user.id) return error("Cannot request a call with yourself", 400);

  const request_ = await db.callRequest.create({
    data: {
      requesterId: user.id,
      researcherId,
      phone,
      reason,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime,
      message,
    },
  });

  await createNotification({
    userId: researcherId,
    type: "CALL_REQUEST",
    title: "New call request",
    message: `${user.name} requested a call: ${reason}`,
    link: "/dashboard/call-requests",
  });

  return success({ request: request_ }, 201);
}
