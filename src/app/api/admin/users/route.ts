import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = 20;

  const where: Prisma.UserWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
  if (role) where.role = role as Prisma.UserWhereInput["role"];

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, verificationStatus: true,
        createdAt: true, lastActiveAt: true, avatarUrl: true,
        researcherProfile: { select: { verified: true, publications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.user.count({ where }),
  ]);

  return success({ users, total, page, totalPages: Math.ceil(total / perPage) });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { userId, action, value } = body;

  if (!userId) return error("User ID required", 422);

  const target = await db.user.findUnique({
    where: { id: userId },
    include: { researcherProfile: true },
  });
  if (!target) return error("User not found", 404);

  // Role change protection: only SUPER_ADMIN can assign ADMIN, and never via this endpoint
  if (action === "changeRole") {
    if (viewer.adminRole !== "SUPER_ADMIN")
      return forbidden("Only Super Admin can change roles.");
    if (!["STUDENT", "TEACHER", "RESEARCHER"].includes(value))
      return forbidden("Cannot set admin role through this endpoint.");
  }

  switch (action) {
    case "suspend": {
      await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
      await auditLog({
        actorId: viewer.id, action: "SUSPEND_USER", entityType: "User", entityId: userId,
        after: { status: "SUSPENDED" },
      });
      return success({ message: "User suspended" });
    }
    case "unsuspend": {
      await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
      await auditLog({
        actorId: viewer.id, action: "UNSUSPEND_USER", entityType: "User", entityId: userId,
        after: { status: "ACTIVE" },
      });
      return success({ message: "User unsuspended" });
    }
    case "disable": {
      await db.user.update({ where: { id: userId }, data: { status: "DISABLED" } });
      await auditLog({
        actorId: viewer.id, action: "DISABLE_USER", entityType: "User", entityId: userId,
        after: { status: "DISABLED" },
      });
      return success({ message: "Account disabled" });
    }
    case "changeRole": {
      await db.user.update({ where: { id: userId }, data: { role: value } });
      await auditLog({
        actorId: viewer.id, action: "CHANGE_ROLE", entityType: "User", entityId: userId,
        before: { role: target.role }, after: { role: value },
      });
      return success({ message: "Role updated" });
    }
    case "verify": {
      await db.user.update({
        where: { id: userId },
        data: { verificationStatus: value ? "VERIFIED" : "REJECTED" },
      });
      if (target.researcherProfile) {
        await db.researcherProfile.update({
          where: { userId },
          data: { verified: !!value },
        });
      }
      await auditLog({
        actorId: viewer.id, action: "VERIFY_USER", entityType: "User", entityId: userId,
        after: { verified: !!value },
      });
      return success({ message: "Verification updated" });
    }
    default:
      return error("Unknown action", 400);
  }
}
