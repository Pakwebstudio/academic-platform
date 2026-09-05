"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

type AdminPaper = {
  id: string;
  title: string;
  slug: string;
  status: string;
  accessType: string;
  price: number | null;
  researchField: string | null;
  views: number;
  createdAt: string;
  uploader: { id: string; name: string };
  authors: { name: string }[];
};

const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_REVIEW: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  REQUEST_CHANGES: { label: "Changes", variant: "primary" },
  REMOVED: { label: "Removed", variant: "danger" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
};

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / 20);

  const fetchPapers = async (p = page) => {
    try {
      const res = await fetch(`/api/admin/papers?page=${p}`);
      const data = await res.json();
      if (data.success) {
        setPapers(data.data.papers);
        setTotal(data.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
        <h1 className="text-2xl font-bold text-slate-900">Research Paper Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">Review, approve, and manage papers</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Link href="/admin/papers" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">All</Link>
        <Link href="/admin/papers/pending" className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">Pending</Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : papers.length === 0 ? (
          <EmptyState title="No papers found" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Paper</th>
                <th className="px-4 py-3 font-medium">Uploader</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => (
                <tr key={paper.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-slate-900 truncate">{paper.title}</p>
                    <p className="text-xs text-slate-400">{paper.authors.map(a => a.name).join(", ")}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{paper.uploader.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[paper.status]?.variant || "default"}>
                      {statusBadge[paper.status]?.label || paper.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{paper.accessType}{paper.price ? ` · ${paper.price}` : ""}</td>
                  <td className="px-4 py-3 text-slate-500">{paper.views}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(paper.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {paper.status === "PENDING_REVIEW" || paper.status === "REQUEST_CHANGES" ? (
                        <>
                          <Button size="sm" variant="success" onClick={() => action(paper.id, "approve")} loading={actingId === paper.id}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => {
                            const reason = window.prompt("Reason for rejection:");
                            if (reason) action(paper.id, "reject", reason);
                          }} loading={actingId === paper.id}>Reject</Button>
                        </>
                      ) : paper.status === "APPROVED" ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => action(paper.id, "suspend")} loading={actingId === paper.id}>Suspend</Button>
                          <Button size="sm" variant="outline" onClick={() => action(paper.id, "remove")} loading={actingId === paper.id}>Remove</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="success" onClick={() => action(paper.id, "restore")} loading={actingId === paper.id}>Restore</Button>
                      )}
                      <Link href={`/papers/${paper.slug}`}>
                        <Button size="sm" variant="ghost">View</Button>
                      </Link>
                    </div>
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
