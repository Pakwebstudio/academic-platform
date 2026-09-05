import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DbRow } from "@/lib/db-types";

export default async function ResearcherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user;
  try {
    user = await db.user.findUnique({
      where: { id },
      include: {
        researcherProfile: { include: { university: true } },
        department: { select: { name: true } },
        researchInterests: { include: { researchArea: true } },
        qualifications: true,
        experiences: true,
        socialLinks: true,
        papers: {
          where: { status: "APPROVED" },
          include: { authors: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        profile: true,
      },
    });
  } catch {
    notFound();
  }

  if (!user) notFound();

  const interests = user.researchInterests.map((ri: DbRow) => ri.researchArea.name);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        <Avatar src={user.avatarUrl} name={user.name} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            {user.researcherProfile?.verified && (
              <Badge variant="success">Verified</Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            {user.designation || user.researcherProfile?.designation || "Researcher"}
            {user.researcherProfile?.university && ` · ${user.researcherProfile.university.name}`}
          </p>
          {user.department && (
            <p className="text-sm text-slate-400">{user.department.name}</p>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="text-slate-600">
              <strong className="text-slate-900">{user.researcherProfile?.publications || 0}</strong> publications
            </span>
            <span className="text-slate-600">
              <strong className="text-slate-900">{user.researcherProfile?.citations || 0}</strong> citations
            </span>
          </div>

          {/* Contact buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <a href={`mailto:${user.email}`}>
              <Button variant="outline" size="sm">Send Email</Button>
            </a>
            {user.researcherProfile?.whatsappNumber && (
              <a href={`https://wa.me/${user.researcherProfile.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <Button variant="success" size="sm">WhatsApp</Button>
              </a>
            )}
            <Link href={`/dashboard/call-requests?user=${user.id}`}>
              <Button variant="secondary" size="sm">Request a Call</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {(user.bio || user.researcherProfile?.bio || user.profile?.aboutUs) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {user.researcherProfile?.bio || user.bio || user.profile?.aboutUs}
              </p>
            </Card>
          )}

          {/* Research Interests */}
          {interests.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Research Interests</h2>
              <div className="flex flex-wrap gap-2">
                {interests.map((i: string) => (
                  <Badge key={i} variant="primary">{i}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Publications */}
          {user.papers.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Publications</h2>
              <div className="space-y-4">
                {user.papers.map((paper: DbRow) => (
                  <Link key={paper.id} href={`/papers/${paper.slug}`} className="block p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <h3 className="font-medium text-slate-900 hover:text-primary">{paper.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{paper.abstract}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{paper.accessType}</Badge>
                      {paper.researchField && <Badge variant="primary" className="text-xs">{paper.researchField}</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Academic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Academic Info</h2>
            <dl className="space-y-2 text-sm">
              {user.designation && (
                <><dt className="text-slate-500">Designation</dt><dd className="text-slate-900">{user.designation}</dd></>
              )}
              {user.researcherProfile?.university && (
                <><dt className="text-slate-500">University</dt><dd className="text-slate-900">{user.researcherProfile.university.name}</dd></>
              )}
              {user.department && (
                <><dt className="text-slate-500">Department</dt><dd className="text-slate-900">{user.department.name}</dd></>
              )}
            </dl>
          </Card>

          {/* Social Links */}
          {user.socialLinks.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Links</h2>
              <ul className="space-y-2 text-sm">
                {user.socialLinks.map((link: DbRow) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {link.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Education */}
          {user.qualifications.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Education</h2>
              <div className="space-y-3">
                {user.qualifications.map((q: DbRow) => (
                  <div key={q.id}>
                    <p className="text-sm font-medium text-slate-900">{q.degree}</p>
                    <p className="text-sm text-slate-500">{q.university}{q.yearTo ? ` (${q.yearFrom}–${q.yearTo})` : ""}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Experience */}
          {user.experiences.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Experience</h2>
              <div className="space-y-3">
                {user.experiences.map((e: DbRow) => (
                  <div key={e.id}>
                    <p className="text-sm font-medium text-slate-900">{e.role}</p>
                    <p className="text-sm text-slate-500">{e.organization}{e.endYear ? ` (${e.startYear}–${e.current ? "Present" : e.endYear})` : ""}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
