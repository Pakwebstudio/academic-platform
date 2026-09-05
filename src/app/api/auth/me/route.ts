import { getCurrentUser } from "@/lib/auth";
import { success } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return success({ user: null }, 200);
  }
  return success({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
    },
  });
}
