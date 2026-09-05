"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Links to the secure reader for papers the current user can access.
export function ReadButton({ paperId, hasAccess }: { paperId: string; hasAccess: boolean }) {
  if (!hasAccess) {
    return <Button variant="success" disabled>Read Paper</Button>;
  }
  return (
    <Link href={`/papers/${paperId}/read`}>
      <Button variant="success">Read Paper</Button>
    </Link>
  );
}
