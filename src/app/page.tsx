import Link from "next/link";
import { db } from "@/lib/db";
import { PaperCard } from "@/components/ui/paper-card";
import { ResearcherCard } from "@/components/ui/researcher-card";

async function getHomepageData() {
  const [researchers, papers, universities, researchAreas] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["TEACHER", "RESEARCHER"] }, status: "ACTIVE" },
      include: {
        researcherProfile: { include: { university: true } },
        researchInterests: { include: { researchArea: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    db.researchPaper.findMany({
      where: { status: "APPROVED" },
      include: {
        authors: { select: { name: true, user: { select: { id: true, avatarUrl: true } } } },
        university: { select: { name: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    db.university.findMany({ take: 8, orderBy: { name: "asc" } }),
    db.researchArea.findMany({ take: 12, orderBy: { name: "asc" } }),
  ]);

  return { researchers, papers, universities, researchAreas };
}

type HomepageData = Awaited<ReturnType<typeof getHomepageData>>;

export default async function HomePage() {
  const data: HomepageData = await getHomepageData().catch(() => ({
    researchers: [],
    papers: [],
    universities: [],
    researchAreas: [],
  }));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
              Discover Research.{" "}
              <span className="text-gradient">Connect with Experts.</span>{" "}
              Advance Knowledge.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              A professional platform for researchers, professors, and students to share, discover, and collaborate on academic research.
            </p>

            {/* Search */}
            <form action="/papers" method="get" className="mt-10 max-w-xl mx-auto">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  name="q"
                  type="search"
                  placeholder="Search researchers, papers, universities, topics..."
                  className="w-full h-14 pl-12 pr-32 rounded-xl border-0 bg-white/95 text-slate-900 placeholder:text-slate-400 text-base focus:outline-2 focus:outline-primary shadow-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTAs */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/papers"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-medium text-white hover:bg-primary-600 shadow-lg shadow-primary/25 transition-all"
              >
                Explore Research
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-base font-medium text-white hover:bg-white/20 backdrop-blur transition-all"
              >
                Join the Community
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div>
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-sm text-slate-400 mt-1">Researchers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-slate-400 mt-1">Papers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-sm text-slate-400 mt-1">Universities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Researchers */}
      {data.researchers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Featured Researchers</h2>
              <p className="mt-1 text-slate-500">Connect with leading academic professionals</p>
            </div>
            <Link href="/researchers" className="text-sm font-medium text-primary hover:text-primary-600">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.researchers.map((r) => (
              <ResearcherCard key={r.id} researcher={r} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Papers */}
      {data.papers.length > 0 && (
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Latest Research</h2>
                <p className="mt-1 text-slate-500">Discover published research papers</p>
              </div>
              <Link href="/papers" className="text-sm font-medium text-primary hover:text-primary-600">
                Browse all papers →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.papers.map((p) => (
                <PaperCard key={p.id} paper={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Research Areas */}
      {data.researchAreas.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Research Areas</h2>
            <p className="mt-1 text-slate-500">Explore research across disciplines</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {data.researchAreas.map((area) => (
              <Link
                key={area.id}
                href={`/papers?area=${area.slug}`}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary hover:bg-indigo-50 transition-colors shadow-sm"
              >
                {area.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Universities */}
      {data.universities.length > 0 && (
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Universities</h2>
                <p className="mt-1 text-slate-500">Browse academic institutions</p>
              </div>
              <Link href="/universities" className="text-sm font-medium text-primary hover:text-primary-600">
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.universities.map((u) => (
                <Link
                  key={u.id}
                  href={`/universities/${u.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-primary font-bold text-sm flex-shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{u.name}</h3>
                    <p className="text-xs text-slate-500 truncate">
                      {u.city && u.country ? `${u.city}, ${u.country}` : u.country || "Academic Institution"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
          <p className="mt-1 text-slate-500">Join the academic research community in minutes</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { step: "1", title: "Create Profile", desc: "Set up your academic profile" },
            { step: "2", title: "Discover", desc: "Find researchers and papers" },
            { step: "3", title: "Publish", desc: "Share your research" },
            { step: "4", title: "Request Access", desc: "Get papers you need" },
            { step: "5", title: "Collaborate", desc: "Connect and work together" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                {item.step}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Advance Your Research?</h2>
          <p className="mt-3 text-lg text-white/80">
            Join thousands of researchers, professors, and students on Acadexa.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-base font-medium text-primary hover:bg-white/90 shadow-lg transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/papers"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-8 text-base font-medium text-white hover:bg-white/10 transition-all"
            >
              Explore Papers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
