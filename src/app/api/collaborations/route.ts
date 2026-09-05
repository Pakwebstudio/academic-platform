import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { auditLog } from "@/lib/audit";

// List collaborations (mine or all open)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  const where = scope === "applications"
    ? { requests: { some: { requesterId: user?.id } } }
    : scope === "mine"
    ? { userId: user?.id }
    : {};

  const collaborations = await db.researchCollaboration.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { requests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({ collaborations });
}

// Create a collaboration opportunity
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const {
    title, description, researchField, requiredSkills, location, remote, deadline,
  } = body;

  if (!title || !description) return error("Title and description required", 422);

  const collaboration = await db.researchCollaboration.create({
    data: {
      userId: user.id,
      title,
      description,
      researchField,
      requiredSkills,
      location,
      remote: remote === true,
      deadline: deadline ? new Date(deadline) : undefined,
    },
  });

  await auditLog({
    actorId: user.id, action: "CREATE_COLLABORATION", entityType: "ResearchCollaboration", entityId: collaboration.id,
  });

  return success({ collaboration }, 201);
}
