# Acadexa — Academic Research & Professional Platform

Acadexa is a full-stack academic research platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Prisma + SQLite/PostgreSQL**, and **JWT cookie-based auth**. It connects researchers, educators, students, and universities for publishing, discovering, and securely exchanging academic research.

> **⚠️ IMPORTANT — Project location:** This project lives in **`D:\acadexa`**, NOT the original `D:\ACADEMIC RESEARCH & PROFESSIONAL PLATFORM` folder. The original path contains spaces and an `&`, which breaks every CLI tool (npm, prisma, next). The code was relocated to a clean path. All commands below assume `D:\acadexa`.

---

## Feature Overview

### Public Site
- Homepage with hero, search, featured papers, research areas, universities, how-it-works
- Paper catalog with search, filters (field, access type, university) and pagination
- Paper detail pages with metadata, authors, abstract, keywords, and access controls
- Researcher directory + public researcher profiles (publications, qualifications, experience, links)
- University directory + university pages
- About & Contact pages
- Registration (restricted roles: STUDENT / TEACHER / RESEARCHER — no public admin signup) and login

### Researcher / User Dashboard
- Overview with stats
- Profile editing (bio, research focus, avatar, WhatsApp, research interests)
- Publish papers (TEACHER / RESEARCHER only) — files stored privately, served only through secure access
- My papers with status (pending review / approved / rejected / changes requested)
- Paper permission requests — request permission to sell a paper; authors approve/reject
- My purchases with secure "Read Paper" (server-side access check + streamed PDF)
- Messaging (direct conversations with other users)
- Call requests (request a consultation call with a researcher; researcher accepts/schedules)
- Collaborations (post opportunities and apply)
- Notifications (in-app) and account settings (change password)

### Paper Selling & Payments
- Paid papers require **author permission** before they can be purchased
- Purchase flow: initiate purchase → provider checkout (mock provider in dev) → payment captured → `PaperAccess` granted
- Secure file access route (`/api/papers/[id]/access`) — files are never publicly served; access requires a valid purchase/ownership/free status
- Platform commission (configurable, default 10%) with earnings split per seller
- Payments, transactions, and refunds managed in the admin panel

### Administration Panel (`/admin`)
- Dashboard with platform statistics
- User management (suspend / disable / verify / change role — role changes to ADMIN blocked unless Super Admin)
- Paper moderation (approve / reject / request changes / suspend / restore / remove)
- Pending paper review queue
- Permission request oversight
- Verification approvals
- Research area management
- University management
- Transactions (view payments, process refunds)
- Reports & moderation
- Call requests
- Audit logs (append-only admin action log)
- Platform settings (commission, currency) + **Super-Admin-only** administrator invitations

### Security
- Custom JWT sessions in httpOnly cookies (7-day TTL)
- Role-based access control (RBAC) enforced **server-side** in every API route
- No public admin registration; administrators are created only via `npm run create-admin` or Super-Admin invitations with one-time tokens/expiry
- Bcrypt password hashing (12 rounds)
- Paper files stored outside `public/`, served only after server-side authorization
- Audit logging for sensitive admin actions

---

## Getting Started

### Prerequisites
- Node.js **v20+** (v24 recommended)
- npm (the project uses npm)

### 1. Install

```bash
cd D:\acadexa
npm install
```

### 2. Configure environment

```bash
copy .env.example .env   # then edit values (see SETUP.md)
```

At minimum, set a strong `AUTH_SECRET`.

### 3. Migrate & seed

```bash
npm run db:migrate        # applies prisma migrations (creates SQLite dev.db)
npm run db:seed           # demo users, universities, research areas, papers
```

If you prefer to skip migrations and sync directly to schema:

```bash
npm run db:push
```

### 4. Create an admin (no public signup)

```bash
npm run create-admin -- --name "Platform Admin" --email admin@example.com --password "StrongPass123!" --role SUPER_ADMIN
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000

### Demo accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@acadexa.com` | `Password123!` |
| Researcher | `researcher@acadexa.com` | `Password123!` |
| Teacher | `teacher@acadexa.com` | `Password123!` |
| Student | `student@acadexa.com` | `Password123!` |

> Log in as an admin, then visit `/admin`. To publish papers, use a TEACHER/RESEARCHER account.

---

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (type checks) |
| `npm start` | Start production server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Sync schema to DB (no migration) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run create-admin` | Create an admin account via CLI |
| `npm test` | Unit tests (Vitest) |
| `npm run test:integration` | API integration tests (boots `next start`) |
| `npm run lint` | ESLint |

### Tests

- **Unit tests** (`npm test`) cover password hashing/verification, input validation, paper file-type/policy checks, RBAC whitelist, and formatting/slug helpers. No server required.
- **Integration tests** (`npm run test:integration`) boot a production server (`next start` on port 3200) and exercise the real APIs: login/session, admin RBAC (401/403), public endpoints, and the full **upload → publish → secure file access** flow. They create a temporary paper/file and clean them up. Requires a seeded DB (`npm run db:seed`).

---

## Architecture

```
src/
  app/                       # App Router pages + API routes
    (marketing)/             # public pages
    dashboard/               # user dashboard
    admin/                   # admin panel
    api/                     # server API routes
  components/
    ui/                      # reusable UI primitives
    dashboard-layout.tsx     # dashboard shell
    admin-layout.tsx         # admin shell
  lib/
    auth.ts                  # JWT session helpers, RBAC
    db.ts                    # Prisma client
    api.ts                   # API response helpers
    payment.ts               # payment provider abstraction (mock)
    storage.ts               # private file storage abstraction
    email.ts                 # email abstraction (nodemailer)
    notifications.ts         # in-app notifications
    audit.ts                 # audit logging
    password.ts              # bcrypt hashing
    utils.ts                 # slugs, formatting, helpers
prisma/
  schema.prisma              # database schema
  seed.js                    # demo data
scripts/
  create-admin.js            # CLI admin creation
```

See `docs/` for deeper guides:

- [SETUP.md](docs/SETUP.md) — detailed setup & deployment
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design
- [DATABASE.md](docs/DATABASE.md) — data model
- [API.md](docs/API.md) — API reference
- [SECURITY.md](docs/SECURITY.md) — security model
- [PAYMENTS.md](docs/PAYMENTS.md) — payment & selling flow

---

## Tech Stack

- **Next.js 16.3** (App Router, `src/` dir, Turbopack)
- **TypeScript**
- **Tailwind CSS v4** (design system with `primary` indigo palette)
- **Prisma 6** + SQLite (default) / Postgres (production)
- **JWT auth** (jsonwebtoken) in httpOnly cookies
- **bcryptjs**, **zod**, **react-hook-form**, **zustand**
- **recharts** (admin charts), **lucide-react**, **date-fns**
- **nodemailer** (email abstraction — logs in dev, SMTP in prod)

---

## Notes for This Environment

- **npm is very slow here** (~8 min for a full install). Run installs with `--no-audit --no-fund` and generous timeouts.
- The **C: drive is nearly full**; the npm cache was relocated to `D:\npm-cache` (`npm config set cache "D:\npm-cache" --global`).
- Invoke CLIs via full quoted paths from PowerShell:
  `& "D:\acadexa\node_modules\.bin\next.cmd" build`
  `& "D:\acadexa\node_modules\.bin\prisma.cmd" db seed`