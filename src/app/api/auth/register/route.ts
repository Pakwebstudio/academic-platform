import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, isStrongPassword } from "@/lib/password";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { success, error, validate } from "@/lib/api";
import { emailService } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import type { Role } from "@/lib/db-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name || !validate.name(name)) {
      return error("Please enter a valid name.", 422);
    }
    if (!email || !validate.email(email)) {
      return error("Please enter a valid email address.", 422);
    }
    if (!password || !isStrongPassword(password)) {
      return error("Password must be at least 8 characters.", 422);
    }

    const validRoles: Role[] = ["STUDENT", "TEACHER", "RESEARCHER"];
    const userRole: Role = validRoles.includes(role as Role)
      ? (role as Role)
      : "STUDENT";

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return error("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: userRole,
        status: "PENDING_VERIFICATION",
        profile: {
          create: {},
        },
        ...(userRole === "RESEARCHER" || userRole === "TEACHER"
          ? {
              researcherProfile: {
                create: {},
              },
            }
          : {}),
      },
    });

    const token = signSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    await auditLog({
      actorId: user.id,
      action: "REGISTER",
      entityType: "User",
      entityId: user.id,
      after: { name: user.name, email: user.email, role: user.role },
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcome(user.email, user.name).catch(() => {});

    return success({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 201);
  } catch (e) {
    console.error("Registration error:", e);
    return error("Something went wrong. Please try again.", 500);
  }
}
