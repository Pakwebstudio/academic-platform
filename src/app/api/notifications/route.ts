import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return success({ notifications });
}
