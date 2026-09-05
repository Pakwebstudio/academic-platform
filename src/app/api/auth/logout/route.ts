import { success } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return success({ message: "Logged out" });
}
