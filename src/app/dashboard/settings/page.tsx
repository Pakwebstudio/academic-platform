"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkeletonBar } from "@/components/ui/feedback";

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) setUser(d.user);
    }).finally(() => setLoading(false));
  }, []);

  const changePassword = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.success ? "Password updated successfully." : data.error || "Failed to update password.");
      if (data.success) setForm({ currentPassword: "", newPassword: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account</p>
      </div>

      {loading ? <SkeletonBar className="h-64 w-full" /> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Account</h2>
            <p className="text-sm text-slate-500 mb-4">Your account information</p>
            <div className="text-sm space-y-2 text-slate-700">
              <p><span className="text-slate-400">Name:</span> {user?.name}</p>
              <p><span className="text-slate-400">Email:</span> {user?.email}</p>
              <p><span className="text-slate-400">Role:</span> {user?.role}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Change Password</h2>
            <p className="text-sm text-slate-500 mb-4">Update your account password</p>
            {message && <p className={`text-sm mb-3 ${message.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>{message}</p>}
            <div className="space-y-3">
              <input
                type="password" placeholder="Current password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
              <input
                type="password" placeholder="New password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
              <Button onClick={changePassword} loading={saving}>Update Password</Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
