import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { generateToken } from "@/lib/utils";
import { emailService } from "@/lib/email";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const isSuper = viewer.adminRole === "SUPER_ADMIN";
  const invitations = isSuper
    ? await db.adminInvitation.findMany({ orderBy: { createdAt: "desc" } })
    : [];

  return success({ invitations, isSuper });
}

export async function POST(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN" || viewer.adminRole !== "SUPER_ADMIN")
    return forbidden("Only Super Admin can invite administrators.");

  const body = await request.json();
  const { name, email, adminRole } = body;
  if (!name || !email || !adminRole) return error("Name, email and role required", 422);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const token = generateToken(48);

  const invitation = await db.adminInvitation.create({
    data: {
      name,
      email: email.toLowerCase(),
      adminRole,
      token,
      expiresAt,
      invitedById: viewer.id,
    },
  });

  await auditLog({
    actorId: viewer.id,
    action: "INVITE_ADMIN",
    entityType: "AdminInvitation",
    entityId: invitation.id,
    after: { email, adminRole },
  });

  const link = `${process.env.APP_URL || "http://localhost:3000"}/admin/accept-invite?token=${token}`;
  await emailService.sendGeneric(
    email,
    "You've been invited to join Acadexa Admin",
    "Administrator Invitation",
    `<p>${viewer.name} has invited you to join Acadexa as an administrator.</p>
     <p>Role: <strong>${adminRole}</strong></p>
     <p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Accept Invitation</a></p>
     <p style="font-size:13px;color:#64748b;">This invitation expires in 7 days and can only be used once.</p>`
  );

  return success({ message: "Invitation sent", invitation }, 201);
}
