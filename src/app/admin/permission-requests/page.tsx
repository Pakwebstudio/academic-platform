"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

type PermissionReq = {
  id: string;
  reason: string;
  proposedPrice: number | null;
  status: string;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  paper: { id: string; title: string };
};

const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  REVOKED: { label: "Revoked", variant: "danger" },
  EXPIRED: { label: "Expired", variant: "outline" },
};

export default function AdminPermissionRequestsPage() {
  const [requests, setRequests] = useState<PermissionReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / 20);

  const fetchRequests = async (p = page) => {
    try {
      const res = await fetch(`/api/admin/permission-requests?page=${p}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.requests);
        setTotal(data.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Paper Permission Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor paper sales authorization</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState title="No permission requests" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Paper</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Proposed Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 truncate max-w-xs">{r.paper.title}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.requester.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.proposedPrice ? `PKR ${r.proposedPrice}` : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[r.status]?.variant || "default"}>
                      {statusBadge[r.status]?.label || r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
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
