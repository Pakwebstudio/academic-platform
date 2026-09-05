# ARCHITECTURE

System design of the Acadexa platform.

## High-Level Overview

```
Browser (Next.js client components)
   │
   ▼
Next.js App Router (server components + API routes)
   │                  │                │
   ├── Prisma ORM ────┴── JWT auth ────┴── storage/payment/email abstractions
   │
   ▼
SQLite / PostgreSQL           uploads/      SMTP        Payment provider
```

- **Rendering**: Server Components for data-heavy public pages; Client Components ("use client") for interactive forms/dashboards.
- **API surface**: Route handlers under `src/app/api/**` returning JSON via helpers in `src/lib/api.ts` (`success`, `error`, `forbidden`, `notFound`).
- **State**: Live data fetched on each request (no client-side cache); lightweight `zustand` available for client state where useful.

## Request Flow (Example: Purchase)

1. Buyer clicks **Purchase Paper** on a paper detail page → `POST /api/purchases`.
2. Server: `getCurrentUser()` → validates JWT cookie → loads user.
3. Checks: paper is APPROVED, is PAID, has `isAuthorized`, buyer != uploader.
4. Creates `PaperPurchase` (PENDING) + `Payment` (PENDING).
5. `paymentProvider.createCheckout()` returns a checkout URL (mock confirmation page in dev).
6. Browser redirects to checkout → `PATCH /api/purchases` confirms → `paymentProvider.capturePayment()`.
7. On success: payment + purchase → SUCCESSFUL, `PaperAccess` created (token), `Earning` created for seller.
8. Buyer notified; UI shows **Read Paper** → streams file via `/api/papers/[id]/access`.

## Key Modules

### `src/lib/auth.ts`
- JWT sign/verify (jsonwebtoken), httpOnly cookie `acadexa_session`, 7-day TTL.
- `getCurrentUser()` — cached per request, reads cookie → verifies → loads User from DB.
- RBAC helpers: `isAdmin`, `isSuperAdmin`, `canPublish`.

### `src/lib/db.ts`
- Singleton PrismaClient export (`db`).

### `src/lib/payment.ts`
- `PaymentProvider` interface; `MockPaymentProvider` for dev.
- `platformCommission()` reads commission from `PlatformSetting`.
- Swap in real providers (Stripe/JazzCash/Easypaisa) implementing the same interface.

### `src/lib/storage.ts`
- `FileStorageService` — local filesystem storage of uploaded paper files.
- Files are stored outside `public/`; they are NEVER directly accessible by URL.
- `getFile(assetId)` returns the buffer for the authorized access route.

### `src/lib/email.ts`
- `EmailService` wrapper around nodemailer. No SMTP config → logs to console in dev.

### `src/lib/notifications.ts`
- `createNotification()` / `notifyMany()` — create in-app notifications.

### `src/lib/audit.ts`
- `auditLog()` — append-only log of admin/sensitive actions (actor, action, entity, before/after).

## Permission System (Paper Selling)

- Papers with `accessType = "PAID"` are created with `needsPermission = true`, `isAuthorized = false`.
- A `PaperPermissionRequest` is created by someone wanting to sell the paper; only the author (rights holder) may approve/reject.
- On approval: paper becomes `isAuthorized = true`, purchasable, and sales create earnings for the rights holder.
- Free/author-published papers can be set authorized directly by uploader.

## Role Model

| Role | Can publish | Can sell | Admin panel |
|------|-------------|----------|-------------|
| STUDENT | No | via permission | No |
| TEACHER | Yes | via permission | No |
| RESEARCHER | Yes | via permission | No |
| ADMIN | — | — | Yes (per `adminRole`) |

## Admin Hierarchy

`AdminRole` on `User`: SUPER_ADMIN, USER_MANAGER, CONTENT_MODERATOR, PAYMENT_MANAGER, VERIFICATION_MANAGER, SUPPORT_ADMIN. The panel UI checks these for feature gating; API routes enforce `role === "ADMIN"` server-side. Role assignment → ADMIN is only possible via `npm run create-admin` or Super-Admin invitations.

## Security Architecture

See [SECURITY.md](SECURITY.md) for the detailed threat model.

## Deployment Topology

- Single Node process (Next.js) + one DB + local uploads directory.
- Scale path: Postgres + object storage (S3/R2) + serverless Next.js.