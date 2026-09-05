import Link from "next/link";
import { Badge } from "./badge";
import { Avatar } from "./avatar";
import { truncate, formatDate, formatCurrency } from "@/lib/utils";

type Paper = {
  id: string;
  title: string;
  slug: string;
  abstract: string;
  researchField?: string | null;
  accessType: "FREE" | "PAID" | "EXTERNAL_LINK";
  price?: number | null;
  currency?: string;
  status: string;
  views: number;
  createdAt: Date | string;
  authors?: { name: string; user?: { id: string; avatarUrl?: string | null } | null }[];
  university?: { name: string } | null;
};

export function PaperCard({ paper }: { paper: Paper }) {
  const accessBadge =
    paper.accessType === "FREE"
      ? { label: "Free", variant: "success" as const }
      : paper.accessType === "PAID"
      ? { label: formatCurrency(paper.price, paper.currency), variant: "warning" as const }
      : { label: "External", variant: "outline" as const };

  return (
    <Link href={`/papers/${paper.slug}`}>
      <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
              {paper.title}
            </h3>
          </div>
          <Badge variant={accessBadge.variant}>{accessBadge.label}</Badge>
        </div>

        {paper.authors && paper.authors.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {paper.authors.slice(0, 3).map((a, i) => (
                <Avatar
                  key={i}
                  src={a.user?.avatarUrl}
                  name={a.name}
                  size="sm"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
            <span className="text-sm text-slate-600 truncate">
              {paper.authors.map((a) => a.name).join(", ")}
            </span>
          </div>
        )}

        <p className="text-sm text-slate-500 line-clamp-3 mb-3">
          {truncate(paper.abstract, 200)}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {paper.researchField && <Badge variant="primary">{paper.researchField}</Badge>}
          {paper.university && <Badge>{paper.university.name}</Badge>}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{formatDate(paper.createdAt)}</span>
          <span>{paper.views.toLocaleString()} views</span>
        </div>
      </div>
    </Link>
  );
}
