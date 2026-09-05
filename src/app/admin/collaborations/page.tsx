"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

type Collaboration = {
  id: string;
  title: string;
  description: string;
  researchField?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string };
  _count: { requests: number };
};

const statusVariant: Record<string, "success" | "warning" | "outline"> = {
  OPEN: "success",
  FILLED: "outline",
  CLOSED: "outline",
};

export default function AdminCollaborationsPage() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/collaborations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCollaborations(d.data.collaborations); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Collaborations</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor research collaboration postings</p>
      </div>

      {loading ? <SkeletonBar className="h-40 w-full" /> : collaborations.length === 0 ? (
        <EmptyState title="No collaborations" />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Research Field</th>
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {collaborations.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-slate-600">{c.user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.researchField || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c._count.requests}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[c.status] || "outline"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}