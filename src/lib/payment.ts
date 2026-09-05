import { db } from "@/lib/db";
import crypto from "crypto";

export type CreatePaymentInput = {
  purchaseId: string;
  userId: string;
  amount: number;
  currency: string;
  platformFee: number;
  sellerAmount: number;
};

export interface PaymentProvider {
  createCheckout(input: CreatePaymentInput): Promise<{ sessionId: string; url: string; raw?: unknown }>;
  verifyWebhook(payload: unknown, signature?: string): Promise<boolean>;
  capturePayment(sessionId: string): Promise<{ success: boolean; providerTransactionId: string }>;
  refund(providerTransactionId: string, amount: number): Promise<boolean>;
}

// Mock provider used during development when no real credentials are available.
class MockPaymentProvider implements PaymentProvider {
  async createCheckout(input: CreatePaymentInput) {
    const sessionId = `mock_ses_${crypto.randomBytes(12).toString("hex")}`;
    await db.payment.update({
      where: { purchaseId: input.purchaseId },
      data: { providerTransactionId: sessionId, rawPayload: JSON.stringify({ input }) },
    });
    return {
      sessionId,
      // In dev, the "checkout" is a confirmation page that simulates success
      url: `${process.env.APP_URL || "http://localhost:3000"}/checkout/${input.purchaseId}/mock?session_id=${sessionId}`,
      raw: { mock: true, sessionId },
    };
  }

  async verifyWebhook() {
    return true;
  }

  async capturePayment(sessionId: string) {
    return { success: true, providerTransactionId: sessionId };
  }

  async refund() {
    return true;
  }
}

class PaymentProviderFactory {
  private provider: PaymentProvider;

  constructor() {
    const configured = process.env.PAYMENT_PROVIDER || "MOCK";
    switch (configured) {
      case "MOCK":
      default:
        this.provider = new MockPaymentProvider();
    }
  }

  get(): PaymentProvider {
    return this.provider;
  }
}

export const paymentProvider = new PaymentProviderFactory().get();
export const platformCommission = async () => {
  const setting = await db.platformSetting.findUnique({ where: { key: "platform_commission" } });
  return setting ? Number(setting.value) : 10;
};
