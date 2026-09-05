# DATABASE

Data model for Acadexa (Prisma schema: `prisma/schema.prisma`).

## Providers

- **Development / single-node**: SQLite (`file:./dev.db`)
- **Production / multi-instance**: PostgreSQL (`DATABASE_URL`)

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

Migration history lives in `prisma/migrations/`. Apply with:

```bash
npm run db:migrate     # dev (creates + applies new migration)
# production: npx prisma migrate deploy
```

## Notes

- JS keywords (e.g. `model`/`category`) are not used as field names in feeds; `request` variable naming inside route handlers avoids shadowing the request param (Turbopack build error).
- Prisma 6 requires 1:1 relations to only declare FK fields on one side; `Payment` owns the `purchaseId @unique`, `PaperPurchase.payment` is the back-relation.
- M2M relations use explicit join models (UniversityDepartment, PaperResearchArea, UserResearchInterest) for future column expansion.