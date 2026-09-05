"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";

type AuditLog = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(total / 25);

  useEffect(() => {
    fetch(`/api/admin/audit-logs?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLogs(d.data.logs);
          setTotal(d.data.total);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Append-only record of administrative actions</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-40 w-full" />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Entity ID</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{log.actor?.name || "System"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="primary">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.entityType || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{log.entityId?.slice(0, 8) || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
