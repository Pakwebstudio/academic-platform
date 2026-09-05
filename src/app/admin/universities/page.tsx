"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonBar } from "@/components/ui/feedback";

type University = {
  id: string;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  verified: boolean;
  _count: { papers: number; researchers: number };
};

export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", website: "", country: "", city: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUniversities = async () => {
    try {
      const res = await fetch("/api/admin/universities");
      const data = await res.json();
      if (data.success) setUniversities(data.data.universities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const addUniversity = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", website: "", country: "", city: "" });
      setShowAdd(false);
      fetchUniversities();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Universities</h1>
          <p className="text-sm text-slate-500 mt-1">Manage academic institutions</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>Add University</Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="University name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <Button onClick={addUniversity} loading={saving}>Create</Button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">University</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Papers</th>
                <th className="px-4 py-3 font-medium">Researchers</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {universities.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    {u.website && <p className="text-xs text-slate-400">{u.website}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{[u.city, u.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{u._count.papers}</td>
                  <td className="px-4 py-3 text-slate-600">{u._count.researchers}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.verified ? "success" : "outline"}>{u.verified ? "Verified" : "Unverified"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
