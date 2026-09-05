"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// Handles initiating a purchase and redirecting to the checkout
export function PurchaseButton({
  paperId,
  price,
  currency,
}: {
  paperId: string;
  price: number | null;
  currency: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Could not start purchase.");
        return;
      }
      // Redirect to the provider checkout (mock confirmation page in dev)
      window.location.href = data.data.checkout.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Secure purchase at <strong>{formatCurrency(price, currency)}</strong>.
      </p>
      <Button onClick={start} loading={loading}>Purchase Paper</Button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
