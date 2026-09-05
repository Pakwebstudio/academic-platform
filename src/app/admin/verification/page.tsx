"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type VerificationReq = {
  id: string;
  universityName: string | null;
  departmentName: string | null;
  designation: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/verification");
      const data = await res.json();
      if (data.success) setRequests(data.data.requests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const action = async (id: string, verify: boolean) => {
    setActingId(id);
    try {
      await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, verify }),
      });
      fetchRequests();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Verification Center</h1>
        <p className="text-sm text-slate-500 mt-1">Approve researcher and teacher verification requests</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-32 w-full" />
          <SkeletonBar className="h-32 w-full" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState title="No verification requests" description="No pending verification requests." />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar src={r.user.avatarUrl} name={r.user.name} size="md" />
                  <div>
                    <p className="font-medium text-slate-900">{r.user.name}</p>
                    <p className="text-xs text-slate-400">{r.user.email}</p>
                  </div>
                </div>
                <Badge variant={r.status === "PENDING" ? "warning" : r.status === "VERIFIED" ? "success" : "danger"}>
                  {r.status}
                </Badge>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">University</dt>
                  <dd className="text-slate-900 font-medium">{r.universityName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Department</dt>
                  <dd className="text-slate-900 font-medium">{r.departmentName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Designation</dt>
                  <dd className="text-slate-900 font-medium">{r.designation || "—"}</dd>
                </div>
              </dl>

              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="success" onClick={() => action(r.id, true)} loading={actingId === r.id}>
                  Verify
                </Button>
                <Button size="sm" variant="danger" onClick={() => action(r.id, false)} loading={actingId === r.id}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
