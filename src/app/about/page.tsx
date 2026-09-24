import { Leaf, Scissors, Sparkles } from "lucide-react";
import { PageIntro, StoreShell } from "@/components/next-storefront";

export default function AboutPage() {
  return (
    <StoreShell>
      <PageIntro
        eyebrow="Our studio"
        title="Good things take time—and many, many stitches."
        text="The Cozy Crochet began with one hook, a basket of wool and the belief that useful things can still feel deeply personal."
      />
      <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-20">
        <img
          src="/assets/crochet-studio.jpg"
          alt="Shelves of yarn in The Cozy Crochet studio"
          width={1280}
          height={912}
          className="aspect-[16/8] w-full rounded-3xl object-cover shadow-sm ring-1 ring-border"
        />
        <div className="mx-auto grid max-w-4xl gap-12 py-14 md:grid-cols-2">
          <h2 className="font-display text-3xl font-medium">A quieter way of making.</h2>
          <div className="space-y-5 leading-7 text-muted-foreground">
            <p>
              We work in small batches so every stitch gets the attention it deserves. Our colours are
              chosen to live gently in your home, not chase a passing season.
            </p>
            <p>
              From the first loop to the final handwritten note, a single maker stays with your piece. It
              is slower by design—and all the better for it.
            </p>
          </div>
        </div>
        <div className="grid gap-6 border-y border-border py-12 md:grid-cols-3">
          {[
            [Leaf, "Better fibres", "Natural cotton and merino from thoughtful suppliers."],
            [Scissors, "Small batches", "Less waste, closer attention and meaningful variation."],
            [Sparkles, "Finished by hand", "Every edge checked, woven and wrapped in our studio."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Leaf;
            return (
              <div key={String(t)}>
                <I className="text-primary size-5" />
                <h3 className="mt-4 font-display text-xl font-medium">{String(t)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{String(d)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </StoreShell>
  );
}
