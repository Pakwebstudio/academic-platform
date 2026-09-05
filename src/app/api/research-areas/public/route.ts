import { db } from "@/lib/db";
import { success } from "@/lib/api";

export async function GET() {
  const areas = await db.researchArea.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return success({ areas });
}
