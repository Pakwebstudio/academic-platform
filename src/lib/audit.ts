import { db } from "@/lib/db";

export async function auditLog({
  actorId,
  action,
  entityType,
  entityId,
  before,
  after,
  ip,
  metadata,
}: {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  metadata?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        before: before ? JSON.stringify(before) : undefined,
        after: after ? JSON.stringify(after) : undefined,
        ip,
        metadata,
      },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
