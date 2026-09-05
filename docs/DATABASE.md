# DATA MODEL

Acadexa runs **without a database**. Types and enums are defined in `src/lib/db-types.ts`; `src/lib/db.ts` implements an in-memory store that mirrors the Prisma query API and seeds demo data at startup.

## Storage

- All data lives in process memory (`src/lib/db.ts`). It is seeded automatically on module load (7 users, 8 universities, 6 departments, 20 research areas, 11 papers, sample purchases/collaborations, etc.).
- Every deploy / server restart resets data to the seed — treat it as a demo data layer, not durable storage.
- Uploaded paper files are kept on disk (see `STORAGE_PATH`) and are the only persisted user data.
- No connection string, no migrations, no client engine.

## Enums

| Enum | Values |
|------|--------|
| `Role` | STUDENT, TEACHER, RESEARCHER, ADMIN |
| `AdminRole` | SUPER_ADMIN, USER_MANAGER, CONTENT_MODERATOR, PAYMENT_MANAGER, VERIFICATION_MANAGER, SUPPORT_ADMIN |
| `UserStatus` | PENDING_VERIFICATION, ACTIVE, SUSPENDED, DISABLED |
| `VerificationStatus` | NONE, PENDING, VERIFIED, REJECTED |
| `PaperStatus` | DRAFT, PENDING_REVIEW, APPROVED, REJECTED, REQUEST_CHANGES, REMOVED, SUSPENDED |
| `AccessType` | FREE, PAID, EXTERNAL_LINK |
| `PermissionStatus` | PENDING, APPROVED, REJECTED, REVOKED, EXPIRED, REQUEST_CHANGES |
| `PaymentStatus` | PENDING, SUCCESSFUL, FAILED, REFUNDED, CANCELLED |
| `CallRequestStatus` | PENDING, ACCEPTED, REJECTED, RESCHEDULED, COMPLETED, CANCELLED |
| `CollaborationStatus` | OPEN, CLOSED, FILLED |
| `CollaborationRequestStatus` | PENDING, ACCEPTED, REJECTED, CANCELLED |
| `ReportStatus` / `ReportCategory` | OPEN/INVESTIGATING/RESOLVED/DISMISSED; COPYRIGHT/INCORRECT_INFO/SPAM/HARASSMENT/FRAUD/INAPPROPRIATE_CONTENT/OTHER |
| `RefundStatus` | PENDING, PROCESSED, FAILED |

## Core Entities

### User
`name`, `email` (unique), `passwordHash`, `role`, `adminRole?`, `status`, `verificationStatus`, `avatarUrl`, `bio`, `location`, `phone`, `title`, `designation`, `departmentId?`, `isDemo`, `isSeed`.

Relations: `profile`, `researcherProfile`, `papers`, `paperAuthors`, `purchases`, `paperAccesses`, `notifications`, `conversations`, `callRequestsMade/Received`, `collaborations`, `reportsMade/userReports`, `verificationRequest`, `qualifications`, `experiences`, `socialLinks`, `payments`, `earnings`, `auditLogs`, `adminInvited`.

### Profile / ResearcherProfile
- `Profile`: generalized public profile (`headline`, `bio`, `aboutUs`, `skills`, contact fields, `profileCompletion`, `views`).
- `ResearcherProfile`: academic profile (`universityId?`, `departmentId?`, `designation`, `experienceYears`, `researchFocus`, `citations`, `publications`, `verified`, `whatsappNumber`).

### Organizations
- `University` (name, slug, logo, country/city, `verified`)
- `Department` (name, slug)
- `UniversityDepartment` (M2M join)
- `ResearchArea` (name, slug, icon, color) — M2M to papers and users
- `Category` (papers)

### ResearchPaper
`title`, `slug` (unique), `abstract`, `keywords` (JSON string), `researchField`, `publicationType`, journal/conference/publisher, `publicationDate`, `doi`, volume/issue/pages, `citations`, `externalUrl`, `pdfUrl`, `coverImageUrl`, `fileAssetId?` (unique private file), `price`, `currency`, `accessType`, `status`, `views`, `rejectionReason`, `licenseType`, `needsPermission`, `isAuthorized`, `categoryId?`, `uploaderId`, `universityId?`.

Relations: uploader, category, university, `authors` (PaperAuthor), researchAreas, permissions, purchases, fileAsset, reports, accessRecords, earnings.

### PaperAuthor
`paperId`, `userId?`, `name`, `email?`, `affiliation?`, `isPrimary`, `order`.

### PaperPermissionRequest
`requesterId`, `paperId`, `authorUserId?`, `authorName`, `reason`, `proposedPrice?`, `revenueSplit?`, `requestedPermission`, `status`, `responseMessage?`, `expiresAt?`, `decidedBy?`, `decidedAt?`. **Authorizes a paper for sale when APPROVED.**

### Commerce
- **PaperPurchase**: `buyerId`, `paperId`, `amount`, `currency`, `platformFee`, `sellerAmount`, `status`, `accessStatus`.
- **Payment**: `purchaseId` (1:1), `userId`, `amount`, `currency`, `platformFee`, `sellerAmount`, `provider`, `providerTransactionId?`, `status`, `paidAt?`, `rawPayload?`.
- **PaperAccess**: `purchaseId`, `userId`, `paperId`, `accessToken`, `revokedAt?` — the authorization record for reading a paper.
- **Earning**: `userId`, `paymentId`, `paperId`, `purchaseId`, `grossAmount`, `platformFee`, `sellerAmount`, `status`.
- **Refund**: links payment(s).

### Communication / Collaboration
- **Conversation** + **ConversationMember** (userId, unreadCount, blocked) + **Message** (senderId, content, read).
- **CallRequest**: requester → researcher, phone, reason, preferredDate/Time, status.
- **ResearchCollaboration**: owner userId, title, description, researchField, requiredSkills, remote, deadline, status.
- **CollaborationRequest**: requester → collaboration, message, status.

### Governance
- **Notification** (user) & **AdminNotification** (audience)
- **Report**: reporter, reportedUser/paper/conversation/collaboration, category, status, resolution.
- **VerificationRequest**: user verification with documents/status/admin notes.
- **AuditLog**: append-only admin actions.
- **AdminInvitation**: email + one-time token, expiry, role, usedAt.
- **PlatformSetting**: key/value platform config (commission, currency, name).
- **FileAsset**: uploaded file metadata (storagePath, mime, size) — referenced by papers/verifications.

## Migrations

No migrations exist — there is no database. The model is defined once in `src/lib/db-types.ts` and the seed lives in `src/lib/db.ts`.

## Notes

- JS keywords (e.g. `model`/`category`) are not used as field names in feeds; `request` variable naming inside route handlers avoids shadowing the request param (Turbopack build error).
- The in-memory store replicates the Prisma 6 query surface (relations, `include`/`select`/`_count`, operators, atomic updates, nested creates) so callers did not change.
- The store persists a previous 1:1 FK convention: the record owning the FK field is marked explicitly (`on: "this" | "to"` in the relation map in `src/lib/db.ts`).
- If real persistence is needed later, replace the `db` implementation with an actual Prisma client; relation + enum names above map 1:1 to a Prisma schema.