"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState, SkeletonBar } from "@/components/ui/feedback";

type Collaboration = {
  id: string;
  title: string;
  description: string;
  researchField: string | null;
  requiredSkills: string | null;
  remote: boolean;
  status: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { requests: number };
};

export default function CollaborationsPage() {
  const [items, setItems] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", researchField: "", requiredSkills: "", remote: false });

  const fetchItems = async (scope = "mine") => {
    try {
      const res = await fetch(`/api/collaborations?scope=${scope}`);
      const data = await res.json();
      if (data.success) setItems(data.data.collaborations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const create = async () => {
    if (!form.title || !form.description) return;
    await fetch("/api/collaborations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", researchField: "", requiredSkills: "", remote: false });
    setShowForm(false);
    fetchItems();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collaborations</h1>
          <p className="text-sm text-slate-500 mt-1">Find or create research collaboration opportunities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>Create</Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-slate-900">New Collaboration</h3>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Research field" value={form.researchField} onChange={(e) => setForm({ ...form, researchField: e.target.value })} />
            <Input placeholder="Required skills" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} />
            Remote collaboration
          </label>
          <Button onClick={create}>Create Collaboration</Button>
        </Card>
      )}

      {loading ? (
        <SkeletonBar className="h-40 w-full" />
      ) : items.length === 0 ? (
        <EmptyState title="No collaborations" description="Create one to start collaborating." />
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{c.title}</h2>
                    <Badge variant={c.status === "OPEN" ? "success" : "outline"}>{c.status}</Badge>
                    {c.remote && <Badge variant="primary">Remote</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{c.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    {c.researchField && <span>{c.researchField}</span>}
                    {c.requiredSkills && <span>Skills: {c.requiredSkills}</span>}
                    <span>{c._count.requests} application(s)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Created by {c.user.name}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
