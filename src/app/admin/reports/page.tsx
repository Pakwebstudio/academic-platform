"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/utils";

type Report = {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string };
  reportedUser: { id: string; name: string } | null;
  paper: { id: string; title: string } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.success) setReports(data.data.reports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setActingId(id);
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, status }),
      });
      fetchReports();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports & Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">Investigate and resolve user reports</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-40 w-full" />
      ) : reports.length === 0 ? (
        <EmptyState title="No reports" description="No reports have been submitted." />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="danger">{r.category}</Badge>
                  <p className="mt-2 text-sm text-slate-700">{r.description}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Reported by {r.reporter.name} · {formatDateTime(r.createdAt)}
                    {r.reportedUser && ` · Against ${r.reportedUser.name}`}
                  </p>
                  {r.paper && <p className="mt-1 text-xs text-slate-500">Paper: {r.paper.title}</p>}
                </div>
                <Badge variant={r.status === "OPEN" ? "warning" : r.status === "RESOLVED" ? "success" : "outline"}>
                  {r.status}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="primary" onClick={() => updateStatus(r.id, "INVESTIGATING")} loading={actingId === r.id}>Investigating</Button>
                <Button size="sm" variant="success" onClick={() => updateStatus(r.id, "RESOLVED")} loading={actingId === r.id}>Resolve</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "DISMISSED")} loading={actingId === r.id}>Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
