import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { success, error } from "@/lib/api";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return error("Email and password are required.", 422);
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return error("Invalid email or password.", 401);
    }

    if (user.status === "SUSPENDED" || user.status === "DISABLED") {
      return error("Your account has been disabled. Please contact support.", 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password.", 401);
    }

    // Update last active
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    await auditLog({
      actorId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    return success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (e) {
    console.error("Login error:", e);
    return error("Something went wrong. Please try again.", 500);
  }
}
