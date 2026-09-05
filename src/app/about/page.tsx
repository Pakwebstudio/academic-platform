import Link from "next/link";
import { Button } from "@/components/ui/button";

const values = [
  {
    title: "Open Research",
    description: "We believe research should be discoverable, accessible, and shared openly with the academic community.",
  },
  {
    title: "Fair Value",
    description: "Researchers deserve fair compensation for high-quality work. Our permission and revenue-split system ensures rights holders stay in control.",
  },
  {
    title: "Trust & Ethics",
    description: "Every paper is moderated, authors verify their work, and academic integrity is at the core of everything we do.",
  },
];

const stats = [
  { label: "Research Papers", value: "Photos by authors" },
  { label: "Researchers", value: "From universities worldwide" },
  { label: "Universities", value: "Represented on platform" },
  { label: "Secure Access", value: "Payments protected & transparent" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900">About Acadexa</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Acadexa is an academic research platform connecting researchers, educators, universities, and learners —
          enabling discovery, publishing, and secure exchange of knowledge.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mb-12">
        {values.map((v) => (
          <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h2 className="font-semibold text-slate-900 mb-2">{v.title}</h2>
            <p className="text-sm text-slate-600">{v.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-indigo-50 p-6 text-center">
            <p className="text-sm font-semibold text-primary">{s.label}</p>
            <p className="mt-1 text-xs text-slate-500">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Get Started</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register"><Button>Create an Account</Button></Link>
          <Link href="/papers"><Button variant="outline">Browse Papers</Button></Link>
        </div>
      </div>
    </div>
  );
}