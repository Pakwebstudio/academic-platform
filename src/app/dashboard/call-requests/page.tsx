"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type CallRequest = {
  id: string;
  phone: string;
  reason: string;
  message: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  createdAt: string;
  requester: { id: string; name: string };
  researcher: { id: string; name: string };
};

export default function CallRequestsPage() {
  const [requests, setRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMyId(d.user?.id));
    fetch("/api/call-requests")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.data.requests); })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/call-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Call Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Schedule consultations with researchers</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-40 w-full" />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No call requests"
          description="Visit a researcher profile to request a consultation call."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const isResearcher = r.researcher.id === myId;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900">
                        {isResearcher ? r.requester.name : r.researcher.name}
                      </h2>
                      <Badge variant={r.status === "PENDING" ? "warning" : r.status === "SCHEDULED" ? "primary" : r.status === "COMPLETED" ? "success" : "outline"}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{r.reason}</p>
                    {r.message && <p className="text-sm text-slate-500 mt-1">{r.message}</p>}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span>📞 {r.phone}</span>
                      {r.preferredDate && <span>📅 {new Date(r.preferredDate).toLocaleDateString()}</span>}
                      {r.preferredTime && <span>🕐 {r.preferredTime}</span>}
                    </div>
                  </div>
                  {isResearcher && r.status === "PENDING" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="success" onClick={() => updateStatus(r.id, "SCHEDULED")}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "DECLINED")}>Decline</Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
