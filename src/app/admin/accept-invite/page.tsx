import { Suspense } from "react";
import { AcceptInviteForm } from "./accept-invite-form";

export const dynamic = "force-dynamic";

export default function AcceptInvitePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}