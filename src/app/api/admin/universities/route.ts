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

  const universities = await db.university.findMany({
    include: { _count: { select: { papers: true, researchers: true } } },
    orderBy: { name: "asc" },
  });
  return success({ universities });
}

export async function POST(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { name, website, country, city, address, description, logoUrl } = body;
  if (!name || !name.trim()) return error("Name required", 422);

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  const university = await db.university.create({
    data: {
      name: name.trim(),
      slug,
      website,
      country,
      city,
      address,
      description,
      logoUrl,
    },
  });

  await auditLog({
    actorId: viewer.id, action: "CREATE_UNIVERSITY", entityType: "University", entityId: university.id,
  });

  return success({ university }, 201);
}
