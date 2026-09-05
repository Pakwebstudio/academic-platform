import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api";
import { paymentProvider, platformCommission } from "@/lib/payment";
import { generateToken } from "@/lib/utils";
import { emailService } from "@/lib/email";

// Initiate a paper purchase/checkout
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { paperId } = body;
  if (!paperId) return error("Paper ID required", 422);

  const paper = await db.researchPaper.findUnique({
    where: { id: paperId },
    include: { uploader: true },
  });
  if (!paper) return error("Paper not found", 404);
  if (paper.status !== "APPROVED") return error("Paper is not available", 400);
  if (paper.accessType !== "PAID" || !paper.price) return error("Paper is not for sale", 400);

  // Authorization check: paper must be authorized for sale
  if (paper.needsPermission || !paper.isAuthorized) {
    return error("This paper requires author permission before it can be purchased.", 403);
  }

  // Prevent buying own paper
  if (paper.uploaderId === user.id) {
    return error("You cannot purchase your own paper.", 400);
  }

  // Explicitly require a rights holder for paid papers
  const rightsHolder = await db.user.findFirst({
    where: {
      OR: [
        { id: paper.uploaderId },
        { paperAuthors: { some: { paperId: paper.id, userId: { not: null } } } },
      ],
    },
  });

  const amount = paper.price;
  const commission = await platformCommission();
  const platformFee = parseFloat((amount * (commission / 100)).toFixed(2));
  const sellerAmount = parseFloat((amount - platformFee).toFixed(2));

  // Create purchase + payment
  const purchase = await db.paperPurchase.create({
    data: {
      buyerId: user.id,
      paperId: paper.id,
      amount,
      currency: paper.currency || "PKR",
      platformFee,
      sellerAmount,
      status: "PENDING",
    },
  });

  const payment = await db.payment.create({
    data: {
      purchaseId: purchase.id,
      userId: user.id,
      amount,
      currency: paper.currency || "PKR",
      platformFee,
      sellerAmount,
      provider: process.env.PAYMENT_PROVIDER || "MOCK",
      status: "PENDING",
    },
  });

  const checkout = await paymentProvider.createCheckout({
    purchaseId: purchase.id,
    userId: user.id,
    amount,
    currency: paper.currency || "PKR",
    platformFee,
    sellerAmount,
  });

  return success({ purchase, payment, checkout, rightsHolderId: rightsHolder?.id });
}

// Confirm a successful payment (called by checkout page / webhook)
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return error("Unauthorized", 401);

  const body = await request.json();
  const { purchaseId, sessionId } = body;
  if (!purchaseId) return error("Purchase ID required", 422);

  const purchase = await db.paperPurchase.findUnique({
    where: { id: purchaseId },
    include: { paper: { include: { uploader: true } } },
  });
  if (!purchase) return error("Purchase not found", 404);
  if (purchase.buyerId !== user.id) return error("Not your purchase", 403);
  if (purchase.status === "SUCCESSFUL") {
    return success({ purchase, alreadyProcessed: true });
  }

  // Capture the payment
  const capture = await paymentProvider.capturePayment(sessionId || "");
  const providerTransactionId = capture.providerTransactionId;

  // Update payment + purchase
  const now = new Date();
  await db.payment.update({
    where: { purchaseId },
    data: {
      status: "SUCCESSFUL",
      providerTransactionId,
      paidAt: now,
      rawPayload: JSON.stringify({ sessionId, mock: true }),
    },
  });

  await db.paperPurchase.update({
    where: { id: purchaseId },
    data: { status: "SUCCESSFUL", accessStatus: "GRANTED" },
  });

  // Grant secure paper access
  const accessToken = generateToken(48);
  await db.paperAccess.create({
    data: {
      purchaseId,
      userId: user.id,
      paperId: purchase.paperId,
      accessToken,
    },
  });

  // Create earning for rights holder (uploader)
  await db.earning.create({
    data: {
      userId: purchase.paper.uploaderId,
      paymentId: (await db.payment.findUnique({ where: { purchaseId } }))!.id,
      paperId: purchase.paperId,
      purchaseId,
      grossAmount: purchase.amount,
      platformFee: purchase.platformFee,
      sellerAmount: purchase.sellerAmount,
      status: "COMPLETED",
    },
  });

  // Update today (publisher) publication sale count maybe

  // Notification to buyer
  await db.notification.create({
    data: {
      userId: user.id,
      type: "PURCHASE",
      title: "Payment received",
      message: `You now have access to "${purchase.paper.title}"`,
      link: "/dashboard/purchases",
    },
  });

  // Notify seller
  await db.notification.create({
    data: {
      userId: purchase.paper.uploaderId,
      type: "SALE",
      title: "New paper sale",
      message: `Your paper "${purchase.paper.title}" was purchased for ${purchase.amount} ${purchase.currency}.`,
      link: "/dashboard/requests",
    },
  });

  emailService.sendGeneric(
    user.email,
    "Your Acadexa purchase",
    "Purchase Confirmed",
    `<p>Your purchase of <strong>"${purchase.paper.title}"</strong> was successful.</p>
     <p>Amount: <strong>${purchase.amount} ${purchase.currency}</strong></p>
     <p>You can now access the paper from your dashboard.</p>`
  ).catch(() => {});

  return success({ purchase, accessToken });
}
