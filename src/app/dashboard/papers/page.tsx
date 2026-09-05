"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type MyPaper = {
  id: string;
  title: string;
  slug: string;
  status: string;
  accessType: string;
  price: number | null;
  views: number;
  rejectionReason: string | null;
  createdAt: string;
  _count: { purchases: number };
};

const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING_REVIEW: { label: "Pending Review", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  REQUEST_CHANGES: { label: "Changes Requested", variant: "primary" },
  DRAFT: { label: "Draft", variant: "outline" },
  REMOVED: { label: "Removed", variant: "danger" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
};

export default function MyPapersPage() {
  const [papers, setPapers] = useState<MyPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/papers")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPapers(d.data.papers); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Papers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your publications</p>
        </div>
        <Link href="/dashboard/publish">
          <Button>Publish Paper</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonBar className="h-24 w-full" />
          <SkeletonBar className="h-24 w-full" />
        </div>
      ) : papers.length === 0 ? (
        <EmptyState
          title="No papers yet"
          description="Publish your first research paper to get started."
          action={<Link href="/dashboard/publish"><Button>Publish Paper</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">{paper.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={statusBadge[paper.status]?.variant || "default"}>
                      {statusBadge[paper.status]?.label || paper.status}
                    </Badge>
                    <Badge variant={paper.accessType === "FREE" ? "success" : "warning"}>{paper.accessType}</Badge>
                    {paper.price && <span className="text-sm text-slate-500">PKR {paper.price}</span>}
                  </div>
                  {paper.rejectionReason && paper.status === "REJECTED" && (
                    <p className="mt-2 text-sm text-rose-600">Reason: {paper.rejectionReason}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {paper.views} views · {paper._count.purchases} purchases
                  </p>
                </div>
                <Link href={`/papers/${paper.slug}`}>
                  <Button size="sm" variant="outline">View</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
