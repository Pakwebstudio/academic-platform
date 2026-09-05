import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, name, password } = body;
  if (!token || !name || !password)
    return error("Token, name and password are required", 422);
  if (password.length < 8)
    return error("Password must be at least 8 characters", 422);

  const invitation = await db.adminInvitation.findUnique({ where: { token } });
  if (!invitation) return error("Invalid invitation token", 400);
  if (invitation.used) return error("This invitation has already been used", 400);
  if (invitation.expiresAt && invitation.expiresAt < new Date())
    return error("This invitation has expired", 400);

  const existing = await db.user.findUnique({ where: { email: invitation.email } });
  if (existing) return error("An account with this email already exists", 409);

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: invitation.email,
      passwordHash,
      role: "ADMIN",
      adminRole: invitation.adminRole,
      status: "ACTIVE",
      verificationStatus: "VERIFIED",
    },
  });

  await db.adminInvitation.update({
    where: { id: invitation.id },
    data: { used: true, usedAt: new Date() },
  });

  return success({ message: "Administrator account created. You can now log in.", user }, 201);
}