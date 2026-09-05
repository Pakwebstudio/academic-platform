import { describe, it, expect } from "vitest";
import { slugify, truncate, initials, generateToken, formatCurrency } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and replaces whitespace with dashes", () => {
    expect(slugify("Deep Learning Models")).toBe("deep-learning-models");
  });

  it("strips special characters", () => {
    expect(slugify("A.I. & ML: 2024!!")).toBe("ai-ml-2024");
  });

  it("collapses separators and trims leading/trailing dashes", () => {
    expect(slugify("--hello___world--")).toBe("hello-world");
  });
});

describe("truncate", () => {
  it("keeps short text unchanged", () => {
    expect(truncate("hi")).toBe("hi");
  });

  it("truncates long text with an ellipsis", () => {
    const out = truncate("a".repeat(200), 50);
    expect(out.length).toBe(51);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("initials", () => {
  it("returns up to two initials", () => {
    expect(initials("Ayesha Khan")).toBe("AK");
  });

  it("handles a single name", () => {
    expect(initials("Muhammad")).toBe("M");
  });
});

describe("generateToken", () => {
  it("produces alphanumeric tokens of the requested length", () => {
    const token = generateToken(48);
    expect(token).toHaveLength(48);
    expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
  });
});

describe("formatCurrency", () => {
  it("handles null amounts", () => {
    expect(formatCurrency(null)).toContain("0");
  });

  it("formats with thousands separators", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("honors the provided currency code", () => {
    expect(formatCurrency(100, "USD")).toContain("100");
  });
});