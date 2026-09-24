import Link from "next/link";
import { StoreShell } from "@/components/next-storefront";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <StoreShell>
      <section className="mx-auto max-w-md px-5 py-24 sm:py-32 text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
          404 — Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This route doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Button size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-1.5 size-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </section>
    </StoreShell>
  );
}
