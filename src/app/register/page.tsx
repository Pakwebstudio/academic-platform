"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

const roleCards: { role: Role; title: string; desc: string; icon: string }[] = [
  { role: "STUDENT", title: "Student", desc: "Discover research papers, find researchers, and access academic resources.", icon: "📚" },
  { role: "TEACHER", title: "Teacher / Professor", desc: "Create academic profiles, publish papers, and receive contact requests.", icon: "🎓" },
  { role: "RESEARCHER", title: "Researcher / Professional", desc: "Publish research, discover papers, request access, and collaborate.", icon: "🔬" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">(roleCards.length === 0 ? "form" : "role");
  const [selectedRole, setSelectedRole] = useState<Role>("STUDENT");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-500">Join the academic research community</p>
        </div>

        {step === "role" ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 text-center mb-4">
              How will you use Acadexa?
            </h2>
            {roleCards.map((r) => (
              <button
                key={r.role}
                onClick={() => {
                  setSelectedRole(r.role);
                  setStep("form");
                }}
                className="w-full flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-card transition-all hover:shadow-card-hover hover:border-primary hover:-translate-y-0.5"
              >
                <span className="text-3xl">{r.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={() => setStep("role")} className="text-sm text-primary hover:underline">
                ← Change role
              </button>
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-slate-600 font-medium">
                Signing up as <span className="text-primary">{selectedRole}</span>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  placeholder="Dr. Muhammad Ali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  placeholder="you@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-2 focus:outline-primary"
                  placeholder="At least 8 characters"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-primary text-white font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary-600">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
