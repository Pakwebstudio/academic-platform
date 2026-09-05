"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setMessage("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      });
      const data = await res.json();
      if (data.success) setMessage("Account created! You can now log in.");
      else setError(data.error || "Failed to accept invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Accept Administrator Invitation</h1>
      <p className="text-sm text-slate-500 mb-5">Set up your administrator account to join the platform.</p>

      {message ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-600">{message}</p>
          <Link href="/login" className="inline-block">
            <Button>Go to Login</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <Button onClick={submit} loading={loading} className="w-full">Create Account</Button>
        </div>
      )}
    </Card>
  );
}