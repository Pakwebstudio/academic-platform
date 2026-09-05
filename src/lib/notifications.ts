import { db } from "@/lib/db";
import type { NotificationPriority } from "@/lib/db-types";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  priority = "LOW",
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  priority?: NotificationPriority;
}) {
  try {
    return await db.notification.create({
      data: { userId, type, title, message, link, priority },
    });
  } catch (e) {
    console.error("Notification creation failed:", e);
    return null;
  }
}

export async function notifyMany(
  userIds: string[],
  payload: { type: string; title: string; message?: string; link?: string }
) {
  const unique = [...new Set(userIds)];
  await db.notification.createMany({
    data: unique.map((userId) => ({ userId, ...payload })),
  });
}
