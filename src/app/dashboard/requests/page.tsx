"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type PermissionReq = {
  id: string;
  reason: string;
  proposedPrice: number | null;
  revenueSplit: number | null;
  status: string;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  paper: { id: string; title: string; slug: string; price: number | null };
};

export default function PaperRequestsPage() {
  const [requests, setRequests] = useState<PermissionReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/paper-permissions");
      const data = await res.json();
      if (data.success) setRequests(data.data.requests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const decide = async (id: string, action: string) => {
    setActingId(id);
    try {
      await fetch(`/api/paper-permissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action }),
      });
      fetchRequests();
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Paper Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Permission requests to sell your papers</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-32 w-full" />
          <SkeletonBar className="h-32 w-full" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No permission requests"
          description="When someone wants to sell your paper, the request will appear here for your approval."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-900">{r.paper.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Requested by <strong>{r.requester.name}</strong> ({r.requester.email})
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{r.reason}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {r.proposedPrice && (
                      <span className="text-slate-600">Proposed price: <strong>PKR {r.proposedPrice}</strong></span>
                    )}
                    {r.revenueSplit && (
                      <span className="text-slate-600">Revenue split: <strong>{r.revenueSplit}%</strong></span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge variant={r.status === "PENDING" ? "warning" : r.status === "APPROVED" ? "success" : "danger"}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {r.status === "PENDING" && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="success" onClick={() => decide(r.id, "approve")} loading={actingId === r.id}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => decide(r.id, "reject")} loading={actingId === r.id}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
