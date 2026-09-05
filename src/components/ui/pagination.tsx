"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange?: (p: number) => void;
};

// URL-driven pagination. Used on server-rendered listing pages where the data
// is fetched server-side from the `page` search param, so navigation is done via
// real <Link> hrefs (SEO-friendly, back/forward and refresh work natively).
function LinkPagination({
  page,
  totalPages,
  pages,
}: {
  page: number;
  totalPages: number;
  pages: (number | string)[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const controlClass =
    "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed";
  const itemClass = (active: boolean) =>
    cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
      active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
    );

  return (
    <nav className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={controlClass}>Previous</Link>
      ) : (
        <span className={cn(controlClass, "opacity-40 cursor-not-allowed")}>Previous</span>
      )}
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
        ) : p === page ? (
          <span key={p} className={itemClass(true)}>{p}</span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={itemClass(false)}>{p}</Link>
        )
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={controlClass}>Next</Link>
      ) : (
        <span className={cn(controlClass, "opacity-40 cursor-not-allowed")}>Next</span>
      )}
    </nav>
  );
}

// State-driven pagination. Used inside client components (e.g. admin pages) that
// keep `page` in local state and refetch on change via an event handler.
function ButtonPagination({
  page,
  totalPages,
  pages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  pages: (number | string)[];
  onPageChange: (p: number) => void;
}) {
  const controlClass =
    "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <nav className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={controlClass}
      >
        Previous
      </button>
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              p === page
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={controlClass}
      >
        Next
      </button>
    </nav>
  );
}

function buildPages(page: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | string)[] = [1];
  if (page > 3) pages.push("...");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);
  if (!onPageChange) {
    return <LinkPagination page={page} totalPages={totalPages} pages={pages} />;
  }
  return (
    <ButtonPagination
      page={page}
      totalPages={totalPages}
      pages={pages}
      onPageChange={onPageChange}
    />
  );
}