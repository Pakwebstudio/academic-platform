import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const areas = await db.researchArea.findMany({ orderBy: { name: "asc" } });
  return success({ areas });
}

export async function POST(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { name } = body;
  if (!name || !name.trim()) return error("Name required", 422);

  const slug = slugify(name);
  const existing = await db.researchArea.findUnique({ where: { slug } });
  if (existing) return error("Research area already exists", 409);

  const area = await db.researchArea.create({ data: { name: name.trim(), slug } });

  await auditLog({
    actorId: viewer.id, action: "CREATE_RESEARCH_AREA", entityType: "ResearchArea", entityId: area.id,
  });

  return success({ area }, 201);
}

export async function DELETE(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { id } = body;
  if (!id) return error("ID required", 422);

  await db.researchArea.delete({ where: { id } });

  await auditLog({
    actorId: viewer.id, action: "DELETE_RESEARCH_AREA", entityType: "ResearchArea", entityId: id,
  });

  return success({ message: "Deleted" });
}
