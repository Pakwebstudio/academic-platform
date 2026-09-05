"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/utils";

type CallRequest = {
  id: string;
  phone: string;
  reason: string;
  status: string;
  createdAt: string;
  requester: { id: string; name: string };
  researcher: { id: string; name: string };
};

export default function AdminCallRequestsPage() {
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/call-requests")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.data.requests); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Call Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor call request activity</p>
      </div>

      {loading ? <SkeletonBar className="h-40 w-full" /> : requests.length === 0 ? (
        <EmptyState title="No call requests" />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Researcher</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{r.requester.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.researcher.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.phone}</td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{r.reason}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "PENDING" ? "warning" : r.status === "COMPLETED" ? "success" : "outline"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
