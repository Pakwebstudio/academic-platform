import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";

export async function GET(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = 20;

  const [purchases, total] = await Promise.all([
    db.paperPurchase.findMany({
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        paper: { select: { id: true, title: true } },
        payment: { select: { id: true, provider: true, status: true, providerTransactionId: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.paperPurchase.count(),
  ]);

  const revenue = await db.paperPurchase.aggregate({
    _sum: { amount: true, platformFee: true, sellerAmount: true },
    where: { status: "SUCCESSFUL" },
  });

  return success({ purchases, total, page, totalPages: Math.ceil(total / perPage), revenue });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { purchaseId, action } = body;
  if (!purchaseId) return error("Purchase ID required", 422);

  if (action === "refund") {
    await db.paperPurchase.update({
      where: { id: purchaseId },
      data: { status: "REFUNDED", accessStatus: "REVOKED" },
    });
    await db.paperAccess.updateMany({
      where: { purchaseId },
      data: { revokedAt: new Date() },
    });
    return success({ message: "Purchase refunded" });
  }

  return error("Unknown action", 400);
}
