# SETUP

Detailed setup and deployment guide for Acadexa.

## Prerequisites

- **Node.js ≥ 20** (tested on v24)
- npm
- (Production) a PostgreSQL instance, or keep SQLite for single-node deployments

## Local Development

### 1. Clone / extract the project

```bash
cd "D:\acadexa"
```

> ⚠️ Do NOT run this project from a path containing spaces or `&`. All CLI shims (npm, prisma, next) break on such paths on Windows.

### 2. Install dependencies

```bash
npm install
```

- If npm is slow, use `--no-audit --no-fund`.
- If the C: drive is full, relocate the npm cache: `npm config set cache "D:\npm-cache" --global`.

### 3. Environment

```bash
copy .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./dev.db` (SQLite) or a Postgres URL |
| `AUTH_SECRET` | Strong random string — signs JWT sessions |
| `APP_URL` | Base URL used in emails / checkout links |
| `EMAIL_HOST` | Leave empty in dev (emails are console-logged) |
| `STORAGE_PATH` | Where uploaded paper files are stored (never publicly served) |
| `PAYMENT_PROVIDER` | `MOCK` in dev |

Generate an auth secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Database

```bash
npm run db:migrate   # applies migrations
npm run db:seed      # demo data (see README for demo accounts)
```

### 5. First administrator

There is **no public admin registration**. Create the admin from the CLI:

```bash
npm run create-admin -- --name "Platform Admin" --email admin@example.com --password "StrongPass123!" --role SUPER_ADMIN
```

Or invite additional administrators from the admin panel (`/admin/settings`, Super Admin only).

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000

## Publishing a Paper as a Demo

1. Log in as `researcher@acadexa.com` (or register as TEACHER/RESEARCHER).
2. Go to `/dashboard/publish`, fill the form, upload a PDF.
3. Admin approves it at `/admin/papers`.
4. The paper appears publicly once `APPROVED`.

## Selling Papers (Demo Flow)

1. A researcher publishes a **PAID** paper (requires permission by default).
2. Another user requests permission to sell it (`/dashboard/papers` → “Request permission”), or the author approves directly.
3. Once `isAuthorized`, buyers can purchase from the paper page.
4. Buyer clicks **Purchase Paper** → mock checkout confirms → `PaperAccess` granted → **Read Paper** streams the PDF through the secure route.
5. The seller sees earnings; admins see the transaction in `/admin/transactions`.

## Production Deployment

### Vercel

1. Connect the git repo to Vercel.
2. Add the `.env` variables in Project Settings → Environment Variables.
3. For SQLite on Vercel, use a serverless-friendly provider or switch to Postgres:
   `DATABASE_URL="postgresql://USER:PASS@HOST:5432/DB?schema=public"`
4. Run migrations as a pre-deploy step (`npm run db:migrate` breaks in serverless — use `prisma migrate deploy` from a CI job).
5. Set `STORAGE_PROVIDER` to a cloud provider (S3/R2) for persistent file storage; the abstraction in `src/lib/storage.ts` is ready to extend.

### Self-hosted (Docker / VPS)

1. Build: `npm run build`
2. Start: `npm start` (production server on port 3000)
3. Configure a reverse proxy (Nginx/Caddy) with HTTPS.
4. Point `APP_URL` to the public HTTPS URL.
5. Set up SMTP in `.env` to send emails.

### Backup

- SQLite: back up `prisma/dev.db` and the `uploads/` directory.
- Postgres: standard `pg_dump` + backup your storage bucket.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Module not found: jsonwebtoken" | `npm install jsonwebtoken @types/jsonwebtoken` |
| Prisma client stale after schema change | `npm run db:migrate` (regenerates client) |
| Build fails on paths with spaces/`&` | Relocate project to a clean path (e.g. `D:\acadexa`) |
| Emails not arriving | Verify `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`; dev mode logs to console |
| Mock payment "session not found" | Ensure `APP_URL` matches the browser URL (localhost:3000) |