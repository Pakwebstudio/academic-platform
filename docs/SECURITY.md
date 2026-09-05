# SECURITY

Threat model and security controls for Acadexa.

## Principles

1. **Server-side authorization everywhere.** Every API route re-checks the session and role — never trust the client.
2. **No public admin creation.** Registration accepts only STUDENT / TEACHER / RESEARCHER. ADMIN accounts come from the seeded Super Admin or one-time Super-Admin invitations.
3. **Private file serving.** Paper files live outside `public/` and are streamed only through an authorized route.
4. **Layered defenses.** RBAC + cookie security + input validation + audit trail.

## Authentication & Sessions

- Passwords hashed with **bcryptjs** (12 rounds).
- JWT sessions (`jsonwebtoken`) stored in an **httpOnly** cookie (`acadexa_session`, 7-day TTL).
- Cookie flags: `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`.
- `getCurrentUser()` verifies the JWT then loads the live User row each request, so suspensions/status changes take effect immediately (no stale session claims).
- `AUTH_SECRET` must be a long random value; dev default exists only for local convenience.

## Access Control

| Surface | Rule |
|---------|------|
| Publish papers | `canPublish(user)` → TEACHER / RESEARCHER |
| Admin API routes | `viewer.role !== "ADMIN"` → 403 (checked in every admin handler) |
| Super-Admin-only actions | `viewer.adminRole === "SUPER_ADMIN"` (invite admins, change roles) |
| Paper permission approval | Only `authorUserId` may approve/reject |
| Purchase capture | Only the purchase buyer |
| Message threads | Only participants |
| Call request response | Only the researcher |
| Collaboration decisions | Only the collaboration owner |
| Paper file access | Uploader, primary author, free paper, or active `PaperAccess` record |

## Administrator Security

- Admin panel (`/admin`) is client-guarded in `AdminLayout` AND server-guarded in every API.
- Role to ADMIN cannot be set by any client-submitted value:
  - `/api/auth/register` ignores/forbids ADMIN.
  - `/api/admin/users` `changeRole` only permits STUDENT/TEACHER/RESEARCHER.
- Invitations: 48-char random token, 7-day expiry, single-use (`used` flag), role baked in at claim time.
- Sensitive actions append to `AuditLog` (actor, action, entity, before/after state).

## File Security

- Uploaded PDFs validated for MIME (`application/pdf`) and size (≤ 20 MB); images validated to JPEG/PNG/WebP/SVG (≤ 5 MB).
- `STORAGE_PATH` (default `./uploads`) is outside the Next.js `public` directory — no static URL exposure.
- The access route (`/api/papers/[id]/access`) re-checks a valid `PaperAccess` (or free/ownership) then streams the buffer with `Content-Disposition: inline` and `Cache-Control: private, no-store`.

## Payments

- Mock provider in dev (no real money). Real providers plug in behind `src/lib/payment.ts`.
- Platform commission is server-computed and stored on the payment/purchase (not client-computed).
- Refunds are admin-only and recorded via `Refund` + audit log.
- Verify webhook/capture signatures before trusting provider payloads in production.

## Input Validation

- `zod` + `react-hook-form` on heavy forms (publish, register, login).
- `src/lib/api.ts` exposes `validate(...)` helpers; route handlers reject malformed bodies with 422.
- Strong password rule (≥ 8 chars) enforced at registration and password change.
- Email normalization (lowercased) and slugify for unique slugs.

## Additional Controls

- RBAC enum checks prevent privilege escalation via crafted requests.
- Suspended/disabled users are blocked at session load (status checked against DB).
- No secrets in client components; API/providers read from `process.env` server-side.
- `audit.ts` records who did what, with before/after JSON snapshots for admin actions.

## Recommended Production Hardening

1. Use the official deployment (HTTPS) — `secure` cookies will then apply.
2. Set a strong `AUTH_SECRET` and rotate it rarely (rotating logs everyone out).
3. Configure real SMTP (dev mode logs emails to console — do not use in production).
4. Use object storage (S3/R2) via `FileStorageService` for multi-instance setups.
5. Set rate limiting / brute-force protection upstream (e.g., reverse-proxy, WAF) for `/api/auth/login`.
6. Keep `DEBUG`/`console` logging minimal; don't log passwords or tokens.