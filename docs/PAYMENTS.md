# PAYMENTS & PAPER SELLING

How the selling system, permission workflow, and payments work in Acadexa.

## Concepts

- **Access types**: `FREE`, `PAID`, `EXTERNAL_LINK`.
- **Seller**: the rights holder (paper uploader / author) who earns from sales.
- **Permission request**: a `PaperPermissionRequest` created when someone other than the author wants to sell a paper. The author must approve it before the paper becomes purchasable.
- **Platform commission**: percentage taken from each sale (default 10%), stored in `PlatformSetting` (`platform_commission`).

## The Selling Workflow

### 1. Publishing a paid paper
- The uploader publishes with `accessType = "PAID"` and a price.
- On creation, `needsPermission = true` and `isAuthorized = false` (a paid paper needs explicit authorization before others can buy it).
- If the uploader is the author, admin approval (`APPROVED`) makes it visible, and the page shows either "purchase" or "permission required" depending on authorization.

### 2. Requesting permission to sell
- A user (potential seller) creates a `PaperPermissionRequest` via `POST /api/paper-permissions` with `paperId`, `authorName`, `reason`, optional `proposedPrice`/`revenueSplit`.
- The author (rights holder) is notified.
- The author approves/rejects in `/dashboard/requests` (`PATCH /api/paper-permissions/[id]`).
- On **approve**, the paper is set `isAuthorized = true`, `needsPermission = false`.

### 3. Buying
- Only when the paper is `APPROVED` **and** `isAuthorized` can it be purchased.
- Author-uploaded paid papers can be authorized by uploading directly (seed treats uploaded paid papers as `isAuthorized`).
- A buyer cannot purchase their own paper.

### 4. Payment capture (mock provider, dev)
- `POST /api/purchases` with `paperId`:
  1. Validates eligibility.
  2. Creates `PaperPurchase` (PENDING) and `Payment` (PENDING).
  3. Computes the commission server-side:
     `platformFee = price * commission%`, `sellerAmount = price - platformFee`.
  4. Calls `paymentProvider.createCheckout()` → returns `{ sessionId, url }`.
  5. Responds with `checkout.url`.
- Buyer is redirected to the mock checkout page (`/checkout/[purchaseId]/mock?session_id=...`) which simulates a payment UI, then `PATCH /api/purchases` confirms.
- Confirmation **captures** the payment:
  1. `paymentProvider.capturePayment(sessionId)`.
  2. Payment → SUCCESSFUL with `providerTransactionId`, `paidAt`.
  3. Purchase → SUCCESSFUL, `accessStatus = GRANTED`.
  4. `PaperAccess` created.
  5. `Earning` created for the seller (gross, fee, net).
  6. Buyer + seller notified; buyer emailed.

### 5. Reading
- Purchase grants active `PaperAccess` → `/api/papers/[id]/access` streams the PDF.
- Free papers and the uploader/primary authors also get access without a purchase.

## Earning & Commission

```
price        = the paper price (buyer pays)
platformFee  = round(price * commission / 100, 2)
sellerAmount = price - platformFee
```

- Commission read live from `PlatformSetting.platform_commission` (editable in `/admin/settings`).
- Stored on both the payment and purchase to preserve history even if settings change later.
- `Earning` records gross/fee/net per sale per seller; admin view is `/admin/transactions`.

## Refunds (Admin)

- `/api/admin/transactions` PATCH `{ paymentId, action: "refund", reason }`:
  - Validates existing successful payment.
  - Calls `paymentProvider.refund()`.
  - Marks payment → REFUNDED, purchase → REFUNDED.
  - Revokes the `PaperAccess` for that purchase (user loses access).
  - Writes a `Refund` row + audit log.

## Provider Abstraction

`src/lib/payment.ts` defines:

```ts
interface PaymentProvider {
  createCheckout(input): Promise<{ sessionId, url, raw }>;
  verifyWebhook(payload, signature?): Promise<boolean>;
  capturePayment(sessionId): Promise<{ success, providerTransactionId }>;
  refund(providerTransactionId, amount): Promise<boolean>;
}
```

- `MockPaymentProvider` is selected when `PAYMENT_PROVIDER = "MOCK"` (default dev).
- To go live: implement the interface for Stripe/JazzCash/Easypaisa, set `PAYMENT_PROVIDER`, and add a webhook handler that verifies signatures.

## Currency

- Default `PKR`, configurable per paper (`currency` field) and mirrored in `PlatformSetting.default_currency`.
- Payments store their own currency snapshot.

## Security Notes

- Price is server-read from the paper, never client-submitted.
- Commission is computed server-side.
- Only the buyer can confirm/capture their purchase (server checks `purchase.buyerId`).
- In production, validate provider webhook signatures and store `rawPayload` for reconciliation.