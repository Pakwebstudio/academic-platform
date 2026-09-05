import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Role, User } from "@prisma/client";
import { cache } from "react";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const SESSION_COOKIE = "acadexa_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};

export function signSessionToken(user: {
  id: string;
  email: string;
  role: Role;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    AUTH_SECRET,
    { expiresIn: SESSION_TTL }
  );
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

// getCurrentUser - cached per request
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const payload = verifySessionToken(token);
    if (!payload) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });
    return user;
  } catch {
    return null;
  }
});

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getServerSession() {
  return getCurrentUser();
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === "ADMIN" && user?.adminRole === "SUPER_ADMIN";
}

export function canPublish(user: User | null): boolean {
  if (!user) return false;
  return ["TEACHER", "RESEARCHER"].includes(user.role);
}
