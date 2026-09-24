"use client";

import Link from "next/link";
import { StoreShell } from "@/components/next-storefront";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StoreShell>
      <section className="mx-auto max-w-md px-5 py-24 sm:py-32 text-center">
        <h1 className="font-display text-2xl font-medium text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An error occurred while loading this page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="sm" onClick={() => reset()}>
            Try Again
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}
