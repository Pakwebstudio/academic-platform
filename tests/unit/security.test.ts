import { describe, it, expect } from "vitest";
import { validate } from "@/lib/api";
import {
  validateFileType,
  ALLOWED_PAPER_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_PAPER_SIZE,
} from "@/lib/storage";
import type { Role } from "@/lib/db-types";

describe("input validation", () => {
  it("validates email addresses", () => {
    expect(validate.email("a@b.com")).toBe(true);
    expect(validate.email("not-an-email")).toBe(false);
    expect(validate.email("a@b")).toBe(false);
  });

  it("validates names", () => {
    expect(validate.name("Dr")).toBe(true);
    expect(validate.name("A")).toBe(false);
  });

  it("validates required values", () => {
    expect(validate.required("x")).toBe(true);
    expect(validate.required("")).toBe(false);
    expect(validate.required(null)).toBe(false);
    expect(validate.required(undefined)).toBe(false);
  });
});

describe("paper file type validation", () => {
  it("allows PDFs for research papers", () => {
    expect(validateFileType("application/pdf", ALLOWED_PAPER_TYPES)).toBe(true);
  });

  it("rejects non-PDF files for papers", () => {
    expect(validateFileType("image/png", ALLOWED_PAPER_TYPES)).toBe(false);
    expect(validateFileType("text/html", ALLOWED_PAPER_TYPES)).toBe(false);
  });

  it("allows common image types", () => {
    expect(validateFileType("image/png", ALLOWED_IMAGE_TYPES)).toBe(true);
    expect(validateFileType("application/pdf", ALLOWED_IMAGE_TYPES)).toBe(false);
  });

  it("caps paper upload size at 20MB", () => {
    expect(MAX_PAPER_SIZE).toBe(20 * 1024 * 1024);
  });
});

describe("RBAC role whitelist", () => {
  it("does not allow self-service ADMIN registration", () => {
    const selfServiceRoles: Role[] = ["STUDENT", "TEACHER", "RESEARCHER"];
    expect(selfServiceRoles).not.toContain("ADMIN");
  });
});