import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isStrongPassword } from "@/lib/password";

describe("password hashing and verification", () => {
  it("hashes without storing the plaintext", async () => {
    const hash = await hashPassword("SecurePass123");
    expect(hash).not.toBe("SecurePass123");
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("SecurePass123");
    expect(await verifyPassword("SecurePass123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("SecurePass123");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("accepts passwords of at least 8 characters", () => {
    expect(isStrongPassword("12345678")).toBe(true);
  });

  it("rejects shorter passwords", () => {
    expect(isStrongPassword("short")).toBe(false);
  });
});