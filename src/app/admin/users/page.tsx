"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  lastActiveAt: string | null;
  avatarUrl: string | null;
  researcherProfile?: { verified: boolean; publications: number } | null;
};

const roleBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  STUDENT: { label: "Student", variant: "primary" },
  TEACHER: { label: "Teacher", variant: "success" },
  RESEARCHER: { label: "Researcher", variant: "warning" },
  ADMIN: { label: "Admin", variant: "danger" },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / 20);

  const fetchUsers = async (p = page, q = query, r = roleFilter) => {
    try {
      const params = new URLSearchParams({ page: String(p), perPage: "20" });
      if (q) params.set("q", q);
      if (r) params.set("role", r);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.data.total);
        setPage(data.data.page);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const action = async (userId: string, act: string, value?: string | boolean) => {
    setActingId(userId);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: act, value }),
      });
      fetchUsers();
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage platform users</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setPage(1); fetchUsers(1, query, roleFilter); }
          }}
          placeholder="Search by name or email..."
          className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-primary"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); fetchUsers(1, query, e.target.value); }}
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-primary"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="RESEARCHER">Researcher</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button variant="outline" onClick={() => { setPage(1); fetchUsers(1, query, roleFilter); }}>Search</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadge[user.role]?.variant || "default"}>
                      {roleBadge[user.role]?.label || user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      user.status === "ACTIVE" ? "success"
                      : user.status === "SUSPENDED" ? "warning"
                      : user.status === "DISABLED" ? "danger"
                      : "outline"
                    }>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      user.verificationStatus === "VERIFIED" ? "success"
                      : user.verificationStatus === "PENDING" ? "warning"
                      : "outline"
                    }>
                      {user.verificationStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {user.status === "ACTIVE" ? (
                        <Button size="sm" variant="danger" onClick={() => action(user.id, "suspend")} loading={actingId === user.id}>
                          Suspend
                        </Button>
                      ) : (
                        <Button size="sm" variant="success" onClick={() => action(user.id, "unsuspend")} loading={actingId === user.id}>
                          Unsuspend
                        </Button>
                      )}
                      {user.verificationStatus !== "VERIFIED" && (
                        <Button size="sm" variant="success" onClick={() => action(user.id, "verify", true)} loading={actingId === user.id}>
                          Verify
                        </Button>
                      )}
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
