"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function MockCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const purchaseId = params.purchaseId as string;
  const sessionId = searchParams.get("session_id") || "";

  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/purchases", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseId, sessionId }),
        });
        const data = await res.json();
        if (data.success) setStatus("success");
        else {
          setStatus("error");
          setError(data.error || "Payment confirmation failed");
        }
      } catch {
        setStatus("error");
        setError("Something went wrong. Please try again.");
      }
    })();
  }, [purchaseId, sessionId]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        {status === "processing" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h1 className="text-xl font-bold text-slate-900">Processing Payment...</h1>
            <p className="mt-2 text-sm text-slate-500">
              This is a simulated checkout. Your payment is being confirmed.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
            <h1 className="text-xl font-bold text-slate-900">Payment Successful!</h1>
            <p className="mt-2 text-sm text-slate-600">
              You now have access to this paper. You can read it anytime from your dashboard.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/dashboard/purchases">
                <Button className="w-full" variant="success">Read Paper</Button>
              </Link>
              <Link href="/papers">
                <Button variant="outline" className="w-full">Continue Browsing</Button>
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">!</div>
            <h1 className="text-xl font-bold text-slate-900">Payment Failed</h1>
            <p className="mt-2 text-sm text-rose-600">{error}</p>
            <Link href="/dashboard/purchases" className="mt-6 inline-block">
              <Button>Go to Purchases</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
