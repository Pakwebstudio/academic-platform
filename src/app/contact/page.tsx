"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setStatus("success");
      else {
        setStatus("error");
        setError(data.error || "Failed to send message.");
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
        <p className="text-sm text-slate-500 mt-1">Have a question or feedback? Send us a message.</p>
      </div>

      {status === "success" ? (
        <Card className="p-6 text-center">
          <p className="text-emerald-600 font-medium">Message sent successfully. We&apos;ll get back to you soon.</p>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea
            rows={5}
            placeholder="Your message"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-primary"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <Button onClick={submit} loading={status === "sending"}>Send Message</Button>
        </Card>
      )}
    </div>
  );
}