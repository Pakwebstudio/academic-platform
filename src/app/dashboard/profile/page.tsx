"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SkeletonBar } from "@/components/ui/feedback";

type ResearchArea = { id: string; name: string; slug: string };

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    headline: "",
    title: "",
    institution: "",
    researchFocus: "",
    whatsappNumber: "",
    avatar: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/research-areas/public").then((r) => r.json()),
    ]).then(([p, a]) => {
      if (p.success) {
        const { user, profile, researcher, interests } = p.data;
        setForm({
          name: user.name || "",
          bio: profile?.bio || "",
          headline: profile?.headline || "",
          title: profile?.title || "",
          institution: profile?.institution || "",
          researchFocus: researcher?.researchFocus || "",
          whatsappNumber: researcher?.whatsappNumber || "",
          avatar: user.avatarUrl || "",
        });
        setSelectedAreas(interests?.map((i: { researchAreaId: string }) => i.researchAreaId) || []);
      }
      if (a.success) {
        setAreas(a.data.areas);
      }
    }).finally(() => setLoading(false));
  }, []);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, researchAreas: selectedAreas }),
      });
      const data = await res.json();
      if (data.success) setMessage("Profile saved successfully!");
      else setMessage(data.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Update your public research profile</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6 space-y-5">
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Title / Position"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Headline"><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
              <Field label="Institution"><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></Field>
              <Field label="Research Focus"><Input value={form.researchFocus} onChange={(e) => setForm({ ...form, researchFocus: e.target.value })} /></Field>
              <Field label="WhatsApp Number"><Input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} /></Field>
              <Field label="Avatar URL"><Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></Field>
            </div>
            <Field label="Bio">
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about your research" />
            </Field>
            <Button onClick={save} loading={saving}>Save Profile</Button>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Research Interests</h3>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleArea(a.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedAreas.includes(a.id)
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
