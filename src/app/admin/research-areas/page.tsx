"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonBar } from "@/components/ui/feedback";

type ResearchArea = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export default function AdminResearchAreasPage() {
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAreas = async () => {
    try {
      const res = await fetch("/api/admin/research-areas");
      const data = await res.json();
      if (data.success) setAreas(data.data.areas);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const addArea = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/research-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      fetchAreas();
    } finally {
      setSaving(false);
    }
  };

  const removeArea = async (id: string) => {
    if (!confirm("Are you sure you want to remove this research area?")) return;
    await fetch("/api/admin/research-areas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAreas();
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Research Areas & Categories</h1>
        <p className="text-sm text-slate-500 mt-1">Manage research fields and categories</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card mb-6">
        <div className="flex gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add new research area..."
            onKeyDown={(e) => { if (e.key === "Enter") addArea(); }}
          />
          <Button onClick={addArea} loading={saving}>Add</Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="p-5 space-y-3">
            <SkeletonBar className="h-10 w-full" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {areas.map((area) => (
              <li key={area.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-slate-900">{area.name}</p>
                  <p className="text-xs text-slate-400">/{area.slug}</p>
                </div>
                <Button size="sm" variant="danger" onClick={() => removeArea(area.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
