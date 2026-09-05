# SETUP

Detailed setup and deployment guide for Acadexa.

## Prerequisites

- **Node.js ≥ 20** (tested on v24)
- npm
- No database is required (data lives in an in-memory store seeded with demo content)

## Local Development

### 1. Clone / extract the project

```bash
cd "D:\academic-platform"
```

> ⚠️ Do NOT run this project from a path containing spaces or `&`. CLI shims (npm, next) break on such paths on Windows.

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
| `AUTH_SECRET` | Strong random string — signs JWT sessions |
| `APP_URL` | Base URL used in emails / checkout links |
| `EMAIL_HOST` | Leave empty in dev (emails are console-logged) |
| `STORAGE_PATH` | Where uploaded paper files are stored (never publicly served) |
| `PAYMENT_PROVIDER` | `MOCK` in dev |

Generate an auth secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Data (no database)

There is no database. `src/lib/db.ts` seeds demo data (users, universities, research areas, papers) automatically when the app starts.

### 5. First administrator

There is **no public admin registration**. A Super Admin is seeded at `admin@acadexa.com` (password `Password123!`). Additional administrators can be invited from the admin panel (`/admin/settings`, Super Admin only).

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

### Netlify

1. Push the repo to GitHub and connect it to Netlify.
2. Add the `.env` variables in Site Settings → Environment Variables (there is **no database** to provision).
3. `netlify.toml` builds with the official Next.js runtime plugin (`npm run build`).
4. Set `STORAGE_PROVIDER` to a cloud provider (S3/R2) if you need persistent paper file storage across deploys; the abstraction in `src/lib/storage.ts` is ready to extend.

### Self-hosted (Docker / VPS)

1. Build: `npm run build`
2. Start: `npm start` (production server on port 3000)
3. Configure a reverse proxy (Nginx/Caddy) with HTTPS.
4. Point `APP_URL` to the public HTTPS URL.
5. Set up SMTP in `.env` to send emails.

### Backup

- Uploaded paper files: back up the `uploads/` directory (`STORAGE_PATH`). All other data is re-derived from the in-memory seed on restart.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Module not found: jsonwebtoken" | `npm install jsonwebtoken @types/jsonwebtoken` |
| Build fails on paths with spaces/`&` | Relocate project to a clean path (e.g. `D:\academic-platform`) |
| Emails not arriving | Verify `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`; dev mode logs to console |
| Mock payment "session not found" | Ensure `APP_URL` matches the browser URL (localhost:3000) |