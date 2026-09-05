"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type Purchase = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  accessStatus: string;
  createdAt: string;
  paper: {
    id: string;
    title: string;
    slug: string;
    accessType: string;
    hasPdf: boolean;
  };
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchases/mine")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPurchases(d.data.purchases); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Purchases</h1>
        <p className="text-sm text-slate-500 mt-1">Papers you have access to</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-24 w-full" />
          <SkeletonBar className="h-24 w-full" />
        </div>
      ) : purchases.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          description="Purchase papers to access them securely."
          action={<Link href="/papers"><Button>Browse Papers</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{p.paper.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Purchased {new Date(p.createdAt).toLocaleDateString()} · {p.currency} {p.amount}
                  </p>
                  <Badge variant={p.accessStatus === "GRANTED" ? "success" : "danger"}>{p.accessStatus}</Badge>
                </div>
                <div className="flex gap-2">
                  {p.accessStatus === "GRANTED" && p.paper.hasPdf && (
                    <Link href={`/papers/${p.paper.id}/read`}>
                      <Button size="sm" variant="success">Read Paper</Button>
                    </Link>
                  )}
                  <Link href={`/papers/${p.paper.slug}`}>
                    <Button size="sm" variant="outline">Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
