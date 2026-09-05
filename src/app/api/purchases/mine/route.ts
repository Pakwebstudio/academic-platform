import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const purchases = await db.paperPurchase.findMany({
    where: { buyerId: user.id },
    include: {
      paper: {
        select: {
          id: true,
          title: true,
          slug: true,
          accessType: true,
          fileAssetId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({
    purchases: purchases.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      accessStatus: p.accessStatus,
      createdAt: p.createdAt,
      paper: {
        ...p.paper,
        hasPdf: !!p.paper.fileAssetId,
      },
    })),
  });
}
