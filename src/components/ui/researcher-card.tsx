import Link from "next/link";
import { Badge } from "./badge";
import { Avatar } from "./avatar";

type Researcher = {
  id: string;
  name: string;
  designation?: string | null;
  university?: { name: string } | null;
  avatarUrl?: string | null;
  researcherProfile?: {
    publications?: number;
    citations?: number;
    verified?: boolean;
  } | null;
  researchInterests?: { researchArea: { name: string } }[];
};

export function ResearcherCard({ researcher }: { researcher: Researcher }) {
  const interests = researcher.researchInterests?.map((ri) => ri.researchArea.name) || [];

  return (
    <Link href={`/researchers/${researcher.id}`}>
      <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <Avatar
            src={researcher.avatarUrl}
            name={researcher.name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                {researcher.name}
              </h3>
              {researcher.researcherProfile?.verified && (
                <span className="text-primary">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">
              {researcher.designation || "Researcher"}
              {researcher.university && ` · ${researcher.university.name}`}
            </p>
          </div>
        </div>

        {interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="primary">{interest}</Badge>
            ))}
            {interests.length > 3 && (
              <Badge>+{interests.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span>{researcher.researcherProfile?.publications || 0} publications</span>
          <span>{researcher.researcherProfile?.citations || 0} citations</span>
        </div>
      </div>
    </Link>
  );
}
