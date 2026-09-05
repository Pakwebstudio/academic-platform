"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

type Purchase = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string };
  paper: { id: string; title: string };
  payment: { provider: string; status: string; providerTransactionId: string | null } | null;
};

export default function AdminTransactionsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [revenue, setRevenue] = useState({ _sum: { amount: 0, platformFee: 0, sellerAmount: 0 } });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / 20);

  const fetchPurchases = async (p = page) => {
    try {
      const res = await fetch(`/api/admin/transactions?page=${p}`);
      const data = await res.json();
      if (data.success) {
        setPurchases(data.data.purchases);
        setTotal(data.data.total);
        setRevenue(data.data.revenue);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const refund = async (id: string) => {
    if (!confirm("Are you sure you want to refund this purchase? This will revoke access.")) return;
    setActingId(id);
    try {
      await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId: id, action: "refund" }),
      });
      fetchPurchases();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Transactions & Revenue</h1>
        <p className="text-sm text-slate-500 mt-1">Purchase, payment, and revenue management</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Gross Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">PKR {revenue._sum.amount || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Platform Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">PKR {revenue._sum.platformFee || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-sm text-slate-500">Researcher Earnings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">PKR {revenue._sum.sellerAmount || 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : purchases.length === 0 ? (
          <EmptyState title="No purchases yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Paper</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{p.buyer.name}</td>
                  <td className="px-4 py-3 text-slate-900 truncate max-w-[200px]">{p.paper.title}</td>
                  <td className="px-4 py-3 font-medium">{p.currency} {p.amount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "SUCCESSFUL" ? "success" : p.status === "PENDING" ? "warning" : "danger"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.payment?.provider || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    {p.status === "SUCCESSFUL" && (
                      <Button size="sm" variant="danger" onClick={() => refund(p.id)} loading={actingId === p.id}>Refund</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
