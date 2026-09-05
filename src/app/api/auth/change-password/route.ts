import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { verifyPassword, hashPassword, isStrongPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) return error("Both passwords required", 422);

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return error("Current password is incorrect", 400);

  if (!isStrongPassword(newPassword)) {
    return error("New password must be at least 8 characters with letters and numbers", 422);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return success({ message: "Password updated" });
}
