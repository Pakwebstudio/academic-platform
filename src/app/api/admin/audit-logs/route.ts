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
  const perPage = 25;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.auditLog.count(),
  ]);

  return success({ logs, total, page, totalPages: Math.ceil(total / perPage) });
}
