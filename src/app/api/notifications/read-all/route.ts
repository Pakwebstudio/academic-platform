import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return success({ message: "All notifications marked as read" });
}
