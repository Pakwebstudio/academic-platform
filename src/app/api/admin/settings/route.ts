import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, forbidden } from "@/lib/api";
import { auditLog } from "@/lib/audit";

const DEFAULT_SETTINGS: { key: string; value: string; description: string }[] = [
  { key: "platform_name", value: "Acadexa", description: "Platform display name" },
  { key: "platform_commission", value: "10", description: "Platform commission percentage" },
  { key: "default_currency", value: "PKR", description: "Default currency" },
  { key: "registration_enabled", value: "true", description: "Allow new registrations" },
  { key: "require_verification", value: "false", description: "Require verification to publish" },
];

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  // Ensure defaults exist
  for (const s of DEFAULT_SETTINGS) {
    const existing = await db.platformSetting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await db.platformSetting.create({ data: { key: s.key, value: s.value, description: s.description } });
    }
  }

  const settings = await db.platformSetting.findMany();
  return success({ settings });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return error("Unauthorized", 401);
  if (viewer.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const { key, value } = body;
  if (!key) return error("Key required", 422);

  await db.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  await auditLog({
    actorId: viewer.id, action: "UPDATE_SETTING", entityType: "PlatformSetting", entityId: key,
    after: { key, value },
  });

  return success({ message: "Updated" });
}
