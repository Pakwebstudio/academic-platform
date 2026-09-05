import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  const researcher = await db.researcherProfile.findUnique({ where: { userId: user.id } });
  const interests = await db.userResearchInterest.findMany({
    where: { userId: user.id },
    include: { researchArea: { select: { id: true, name: true } } },
  });

  return success({ user, profile, researcher, interests });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const {
    name, bio, avatar, headline, title, institution,
    researchAreas, whatsappNumber, researchFocus,
  } = body;

  if (name) {
    await db.user.update({ where: { id: user.id }, data: { name } });
  }
  if (typeof avatar === "string") {
    await db.user.update({ where: { id: user.id }, data: { avatarUrl: avatar } });
  }
  if (typeof title === "string") {
    await db.user.update({ where: { id: user.id }, data: { title } });
  }

  await db.profile.upsert({
    where: { userId: user.id },
    update: {
      ...(typeof bio === "string" && { bio }),
      ...(typeof headline === "string" && { headline }),
      ...(typeof institution === "string" && { aboutUs: institution }),
    },
    create: { userId: user.id, bio, headline, aboutUs: institution },
  });

  await db.researcherProfile.upsert({
    where: { userId: user.id },
    update: {
      ...(typeof researchFocus === "string" && { researchFocus }),
      ...(typeof whatsappNumber === "string" && { whatsappNumber }),
    },
    create: { userId: user.id, bio, researchFocus: headline || researchFocus, whatsappNumber },
  });

  if (Array.isArray(researchAreas) && researchAreas.length) {
    await db.userResearchInterest.deleteMany({ where: { userId: user.id } });
    await db.userResearchInterest.createMany({
      data: researchAreas.map((areaId: string) => ({ userId: user.id, researchAreaId: areaId })),
    });
  }

  return success({ message: "Profile updated" });
}
