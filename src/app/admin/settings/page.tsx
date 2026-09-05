"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SkeletonBar } from "@/components/ui/feedback";
import { formatDateTime } from "@/lib/utils";

type Setting = { id: string; key: string; value: string; description: string | null };
type Invitation = {
  id: string; email: string; name: string; adminRole: string;
  used: boolean; expiresAt: string; createdAt: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuper, setIsSuper] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", adminRole: "CONTENT_MODERATOR" });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/invitations").then((r) => r.json()),
    ]).then(([s, i]) => {
      if (s.success) setSettings(s.data.settings);
      if (i.success) {
        setInvitations(i.data.invitations);
        setIsSuper(i.data.isSuper);
      }
    }).finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: string) => {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const createInvitation = async () => {
    if (!inviteForm.email || !inviteForm.name) return;
    await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    setInviteForm({ name: "", email: "", adminRole: "CONTENT_MODERATOR" });
    const i = await fetch("/api/admin/invitations").then((r) => r.json());
    if (i.success) setInvitations(i.data.invitations);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure platform-wide settings</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-40 w-full" />
      ) : (
        <div className="space-y-6">
          {/* General settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">General</h2>
            <div className="space-y-4">
              {settings.map((s) => (
                <div key={s.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{s.key}</label>
                    {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
                  </div>
                  <Input
                    value={s.value}
                    onChange={(e) => updateSetting(s.key, e.target.value)}
                    className="sm:w-64"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Admin management */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Administrators</h2>
              {!isSuper && <Badge variant="warning">Super Admin only</Badge>}
            </div>

            {isSuper && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Invite Administrator</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="Name" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
                  <Input placeholder="Email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                  <select
                    value={inviteForm.adminRole}
                    onChange={(e) => setInviteForm({ ...inviteForm, adminRole: e.target.value })}
                    className="flex h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-2 focus:outline-primary"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="USER_MANAGER">User Manager</option>
                    <option value="CONTENT_MODERATOR">Content Moderator</option>
                    <option value="PAYMENT_MANAGER">Payment Manager</option>
                    <option value="VERIFICATION_MANAGER">Verification Manager</option>
                    <option value="SUPPORT_ADMIN">Support Admin</option>
                  </select>
                </div>
                <Button onClick={createInvitation}>Send Invitation</Button>
              </div>
            )}

            {invitations.length === 0 ? (
              <p className="text-sm text-slate-500">No invitations yet.</p>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-slate-50">
                        <td className="px-4 py-2">{inv.name}</td>
                        <td className="px-4 py-2">{inv.email}</td>
                        <td className="px-4 py-2">
                          <Badge variant="primary">{inv.adminRole}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={inv.used ? "success" : "warning"}>{inv.used ? "Used" : "Pending"}</Badge>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">{formatDateTime(inv.expiresAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
