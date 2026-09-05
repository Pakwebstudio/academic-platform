import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { ChildProcess } from "node:child_process";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3200";

let server: ChildProcess | null = null;
let createdPaperId = "";
let createdFileAssetId = "";

async function reachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/research-areas/public`);
    return res.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  const { spawn } = await import("node:child_process");
  const cwd = process.cwd();
  // Spawn node directly against Next's JS CLI to avoid Windows .cmd shim issues.
  const nextBin = `${cwd}\\node_modules\\next\\dist\\bin\\next`;
  server = spawn(process.execPath, [nextBin, "start", "-p", "3200"], {
    cwd,
    env: { ...process.env, PORT: undefined },
    stdio: "ignore",
  });
  server.on("exit", (code) => {
    console.error(`Integration test server exited early with code ${code}`);
  });
  for (let i = 0; i < 60; i++) {
    if (await reachable()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Test server did not become reachable at ${BASE}`);
}

beforeAll(async () => {
  if (!(await reachable())) await startServer();
}, 120000);

afterAll(async () => {
  if (createdPaperId) {
    try {
      const { db } = await import("@/lib/db");
      await db.paperAuthor.deleteMany({ where: { paperId: createdPaperId } });
      await db.researchPaper.delete({ where: { id: createdPaperId } });
    } catch (e) {
      console.error("Failed to clean up test paper:", e);
    }
  }
  if (createdFileAssetId) {
    try {
      const { storageService } = await import("@/lib/storage");
      await storageService.delete(createdFileAssetId);
    } catch (e) {
      console.error("Failed to clean up test file asset:", e);
    }
  }
  if (server) server.kill();
});

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  const data = await res.json();
  return { res, data, cookie: setCookie?.split(";")[0] ?? "" };
}

describe("API auth integration", () => {
  it("logs in the seeded admin and returns a session cookie", async () => {
    const { res, data, cookie } = await login("admin@acadexa.com", "Password123!");
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.role).toBe("ADMIN");
    expect(cookie.startsWith("acadexa_session=")).toBe(true);
  });

  it("rejects an invalid password", async () => {
    const { res, data } = await login("admin@acadexa.com", "wrong-password");
    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("rejects a non-existent account", async () => {
    const { res } = await login("nobody@acadexa.com", "Password123!");
    expect(res.status).toBe(401);
  });
});

describe("API admin RBAC integration", () => {
  it("blocks unauthenticated access to admin endpoints", async () => {
    const res = await fetch(`${BASE}/api/admin/users`);
    expect(res.status).toBe(401);
  });

  it("blocks a non-admin session from admin endpoints", async () => {
    const { cookie, data } = await login("student@acadexa.com", "Password123!");
    expect(data.data.user.role).not.toBe("ADMIN");
    const res = await fetch(`${BASE}/api/admin/users`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
  });

  it("allows the seeded admin to list users", async () => {
    const { cookie } = await login("admin@acadexa.com", "Password123!");
    const res = await fetch(`${BASE}/api/admin/users`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(4);
  });
});

describe("API session integration", () => {
  it("returns the authenticated user for /api/auth/me", async () => {
    const { cookie } = await login("researcher@acadexa.com", "Password123!");
    const res = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe("researcher@acadexa.com");
    expect(body.data.user.role).toBe("RESEARCHER");
  });

  it("returns no user when unauthenticated", async () => {
    const res = await fetch(`${BASE}/api/auth/me`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user).toBeNull();
  });

  it("exposes the public research areas endpoint", async () => {
    const res = await fetch(`${BASE}/api/research-areas/public`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.areas)).toBe(true);
    expect(body.data.areas.length).toBeGreaterThanOrEqual(20);
  });
});

describe("paper file upload and secure access", () => {
  it("requires authentication to upload", async () => {
    const form = new FormData();
    form.append("file", new File([new Uint8Array([37, 80, 68, 70])], "x.pdf", { type: "application/pdf" }));
    const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
    expect(res.status).toBe(401);
  });

  it("rejects non-PDF uploads", async () => {
    const { cookie } = await login("researcher@acadexa.com", "Password123!");
    const form = new FormData();
    form.append("file", new File([new TextEncoder().encode("hello")], "notes.txt", { type: "text/plain" }));
    const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form, headers: { Cookie: cookie } });
    expect(res.status).toBe(422);
  });

  it("uploads a PDF and publishes a paper linked to it", async () => {
    const { cookie } = await login("researcher@acadexa.com", "Password123!");

    const pdf = new File([new TextEncoder().encode("%PDF-1.4 test")], "integration-test.pdf", { type: "application/pdf" });
    const form = new FormData();
    form.append("file", pdf);
    const uploadRes = await fetch(`${BASE}/api/upload`, { method: "POST", body: form, headers: { Cookie: cookie } });
    expect(uploadRes.status).toBe(201);
    const uploadBody = await uploadRes.json();
    createdFileAssetId = uploadBody.data.fileAssetId;
    expect(createdFileAssetId).toBeTruthy();

    const pubRes = await fetch(`${BASE}/api/papers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        title: `Integration Test Paper ${Date.now()}`,
        abstract: "A temporary paper exercising the upload and access flow.",
        keywords: ["test"],
        accessType: "FREE",
        fileAssetId: createdFileAssetId,
      }),
    });
    expect(pubRes.status).toBe(201);
    const pubBody = await pubRes.json();
    createdPaperId = pubBody.data.paper.id;
    expect(pubBody.data.paper.fileAssetId).toBe(createdFileAssetId);

    const accessRes = await fetch(`${BASE}/api/papers/${createdPaperId}/access`, {
      headers: { Cookie: cookie },
    });
    expect(accessRes.status).toBe(200);
    expect(accessRes.headers.get("content-type")).toContain("pdf");
  });

  it("denies file access to users without authorization", async () => {
    const { cookie } = await login("student@acadexa.com", "Password123!");
    const res = await fetch(`${BASE}/api/papers/${createdPaperId}/access`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("admin collaborations RBAC", () => {
  it("blocks non-admins", async () => {
    const { cookie } = await login("student@acadexa.com", "Password123!");
    const res = await fetch(`${BASE}/api/admin/collaborations`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(403);
  });

  it("lists collaborations for admins", async () => {
    const { cookie } = await login("admin@acadexa.com", "Password123!");
    const res = await fetch(`${BASE}/api/admin/collaborations`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.collaborations)).toBe(true);
  });
});