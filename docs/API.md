# API Reference

All API routes are Next.js Route Handlers under `src/app/api/**`. Responses are JSON via helpers in `src/lib/api.ts`:

- Success: `{ success: true, data: ... }`
- Error: `{ success: false, error: "message" }` with an HTTP status code

| Helper | HTTP status |
|--------|-------------|
| `success(data, status=200)` | 200/201/204 |
| `error(msg, status=400)` | 4xx/5xx |
| `unauthorized()` | 401 |
| `forbidden(msg)` | 403 |
| `notFound(msg)` | 404 |

## Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Register (roles STUDENT/TEACHER/RESEARCHER only — ADMIN blocked) |
| POST | `/api/auth/login` | No | Login → sets JWT cookie |
| POST | `/api/auth/logout` | Yes | Clears session cookie |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/change-password` | Yes | Change password (verifies current) |

## Papers & Access

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/papers` | Yes | My papers (as uploader) |
| POST | `/api/papers` | Yes (TEACHER/RESEARCHER) | Publish paper (accepts `fileAssetId`; required for PAID) |
| GET | `/api/papers/[id]/access` | Yes | Stream PDF — requires valid access (purchase/free/ownership) |
| POST | `/api/upload` | Yes (TEACHER/RESEARCHER) | Upload private PDF (multipart `file`; PDF only, ≤20MB) → `{ fileAssetId }` |
| GET | `/api/research-areas/public` | No | All research areas |

## Permissions (Paper Selling)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/paper-permissions` | Yes | Requests where I am the author |
| POST | `/api/paper-permissions` | Yes | Create a permission request to sell a paper |
| PATCH | `/api/paper-permissions/[id]` | Yes (author) | Approve / reject |

## Purchases & Payments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/purchases` | Yes | Initiate purchase (creates Payment + checkout) |
| PATCH | `/api/purchases` | Yes | Confirm payment / capture (called by checkout/webhook) |
| GET | `/api/purchases/mine` | Yes | My purchases |

## Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile` | Yes | My profile + researcher profile + interests |
| PATCH | `/api/profile` | Yes | Update profile (name, bio, avatar, interests, etc.) |

## Messaging

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/messages` | Yes | List my conversations |
| POST | `/api/messages` | Yes | Start a conversation / first message |
| GET | `/api/messages/[id]` | Yes | Conversation with messages (participant only) |
| POST | `/api/messages/[id]` | Yes | Send message |

## Call Requests

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/call-requests` | Yes | Requests I made or received |
| POST | `/api/call-requests` | Yes | Request a call with a researcher |
| PATCH | `/api/call-requests/[id]` | Yes (researcher) | Accept / decline / schedule |

## Collaborations

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/collaborations` | Yes | List (scope=mine/applications/all) |
| POST | `/api/collaborations` | Yes | Create a collaboration |
| POST | `/api/collaborations/requests` | Yes | Apply to join |
| PATCH | `/api/collaborations/requests` | Yes (owner) | Approve / reject applicant |

## Notifications

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/notifications` | Yes | My notifications |
| POST | `/api/notifications/read-all` | Yes | Mark all read |

## Contact

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/contact` | No | Contact form → email + admin notification |

## Admin (`role === "ADMIN"` required, server-side enforced)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List users (filters: q, role) |
| PATCH | `/api/admin/users` | suspend / unsuspend / disable / changeRole / verify |
| GET | `/api/admin/papers` | List papers (filter: status) |
| PATCH | `/api/admin/papers` | approve / reject / changes / suspend / restore / remove |
| GET | `/api/admin/permission-requests` | All permission requests |
| GET | `/api/admin/verification` | Verification requests |
| PATCH | `/api/admin/verification` | approve / reject verification |
| GET/POST/DELETE | `/api/admin/research-areas` | Research area CRUD |
| GET/POST | `/api/admin/universities` | University list/create |
| GET | `/api/admin/transactions` | Payments overview |
| PATCH | `/api/admin/transactions` | Refund a payment |
| GET/PATCH | `/api/admin/reports` | Report list / update status |
| GET | `/api/admin/call-requests` | All call requests |
| GET | `/api/admin/collaborations` | All collaboration postings |
| GET | `/api/admin/audit-logs` | Audit log (paged) |
| GET/PATCH | `/api/admin/settings` | Platform settings |
| GET/POST | `/api/admin/invitations` | List/create admin invitations (Super Admin only) |
| POST | `/api/admin/accept-invite` | Claim an invitation (public, token-based) |

## Auth rules summary

- Every mutation validates the session and role server-side.
- Admin routes always check `viewer.role !== "ADMIN"` → 403.
- Role changes to ADMIN are never accepted from the client: blocked in the users route (`changeRole` restrictor) and registration.
- `create-admin` CLI and `/admin/accept-invite` are the only paths to create administrators.