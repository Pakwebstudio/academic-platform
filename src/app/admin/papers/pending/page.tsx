"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

type AdminPaper = {
  id: string;
  title: string;
  slug: string;
  status: string;
  accessType: string;
  price: number | null;
  researchField: string | null;
  abstract: string;
  views: number;
  createdAt: string;
  uploader: { id: string; name: string; email: string };
  authors: { name: string }[];
};

export default function AdminPendingPapersPage() {
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchPapers = async () => {
    try {
      const res = await fetch(`/api/admin/papers?status=PENDING_REVIEW`);
      const data = await res.json();
      if (data.success) setPapers(data.data.papers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const action = async (paperId: string, act: string, reason?: string) => {
    setActingId(paperId);
    try {
      await fetch("/api/admin/papers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, action: act, reason }),
      });
      fetchPapers();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Paper Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review papers awaiting moderation</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-40 w-full" />
          <SkeletonBar className="h-40 w-full" />
        </div>
      ) : papers.length === 0 ? (
        <EmptyState title="No pending papers" description="All papers have been reviewed." />
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900">{paper.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {paper.authors.map(a => a.name).join(", ")} · Uploaded by {paper.uploader.name} · {formatDate(paper.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pending</Badge>
                  <Badge variant={paper.accessType === "FREE" ? "success" : "warning"}>{paper.accessType}</Badge>
                </div>
              </div>

              <p className="text-sm text-slate-600 line-clamp-3 mb-3">{paper.abstract}</p>

              <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                {paper.researchField && <Badge variant="primary">{paper.researchField}</Badge>}
                <span>{paper.views} views</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => action(paper.id, "approve")} loading={actingId === paper.id}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => {
                  const reason = window.prompt("Reason for rejection:");
                  if (reason) action(paper.id, "reject", reason);
                }} loading={actingId === paper.id}>
                  Reject
                </Button>
                <Button size="sm" variant="primary" onClick={() => {
                  const reason = window.prompt("Requested changes:");
                  if (reason) action(paper.id, "changes", reason);
                }} loading={actingId === paper.id}>
                  Request Changes
                </Button>
                <Link href={`/papers/${paper.slug}`}><Button size="sm" variant="outline">View</Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
