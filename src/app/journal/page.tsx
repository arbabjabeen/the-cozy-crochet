"use client";

import { useState } from "react";
import { Sparkles, BookOpen, Clock, ArrowRight, X, Heart, Leaf, ShieldCheck } from "lucide-react";
import { PageIntro, StoreShell } from "@/components/next-storefront";
import { Button } from "@/components/ui/button";

type JournalPost = {
  id: string;
  title: string;
  category: "Care Guide" | "Studio Story" | "Yarn & Fibres";
  readTime: string;
  image: string;
  date: string;
  excerpt: string;
  fullContent: {
    intro: string;
    points: { title: string; desc: string }[];
    conclusion: string;
  };
};

export default function JournalPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);

  const posts: JournalPost[] = [
    {
      id: "care-guide",
      title: "How to Wash & Care for Your Crochet Heirloom",
      category: "Care Guide",
      readTime: "3 min read",
      date: "Studio Essential",
      image: "/assets/crochet-hero.jpg",
      excerpt:
        "Handmade crochet pieces can last for generations with gentle care. Here are AJ's essential washing and storage rules.",
      fullContent: {
        intro:
          "Because each crochet piece is made with delicate, natural yarn loops, gentle care ensures it keeps its soft shape, stitches, and vibrant colour for years to come.",
        points: [
          {
            title: "1. Gentle Hand Wash Only",
            desc: "Fill a basin with cool or lukewarm water. Add a few drops of mild wool wash or gentle baby shampoo. Gently submerge your piece and swirl softly. Never rub or scrub aggressively.",
          },
          {
            title: "2. Never Wring or Twist",
            desc: "Wringing stretches the stitches. Instead, press the water out gently against the basin edge, then roll the piece inside a clean dry towel and press down.",
          },
          {
            title: "3. Dry Flat in Shape",
            desc: "Lay your piece flat on a fresh towel away from direct harsh sunlight or radiators. Pat it into its original shape and let it air dry naturally.",
          },
          {
            title: "4. Mindful Storage",
            desc: "Always fold your crochet blankets and wear. Never hang them on coat hangers, as gravity will stretch the shoulder seams over time.",
          },
        ],
        conclusion:
          "With these few simple steps, your handmade blanket, tote, or amigurumi will stay as cozy and lovely as the day it left our studio.",
      },
    },
    {
      id: "fibres",
      title: "Why We Choose Natural Cotton & Merino Wool",
      category: "Yarn & Fibres",
      readTime: "4 min read",
      date: "Materials",
      image: "/assets/crochet-studio.jpg",
      excerpt:
        "Synthetic acrylic yarns may be cheap, but natural fibres breathe, feel soothing against the skin, and age gracefully.",
      fullContent: {
        intro:
          "When you hold a crochet piece against your skin, the quality of the yarn makes all the difference. In AJ's studio, we prioritize natural fibres over scratchy plastics.",
        points: [
          {
            title: "1. Breathability & Skin Comfort",
            desc: "Natural cotton and fine merino regulate temperature naturally. They keep you cozy in winter without overheating, making them ideal for babies and sensitive skin.",
          },
          {
            title: "2. Heirloom Longevity",
            desc: "Unlike synthetic yarns that pill and shed microplastics, quality cotton softens with every gentle wash while maintaining structural integrity.",
          },
          {
            title: "3. Gentle on the Earth",
            desc: "Slow craft is about mindful living. Natural fibres are biodegradable and sourced with care from thoughtful, ethical suppliers.",
          },
        ],
        conclusion:
          "Every skein that enters our studio is hand-felt for softness, stitch definition, and long-lasting coziness.",
      },
    },
    {
      id: "slow-batch",
      title: "The Beauty of Slow Craft: Made Loop by Loop",
      category: "Studio Story",
      readTime: "3 min read",
      date: "Our Philosophy",
      image: "/assets/cloud-throw.jpg",
      excerpt:
        "In a world of mass-produced fast fashion, we choose patience. Discover why each piece is made slowly and wrapped with love.",
      fullContent: {
        intro:
          "There are no machines that can replicate true crochet. Every single loop in your piece was worked by human hands with focused patience.",
        points: [
          {
            title: "1. One Maker, Start to Finish",
            desc: "From selecting the yarn skeins to weaving in the final loose ends and tying the kraft gift ribbon, one dedicated maker stays with your commission.",
          },
          {
            title: "2. The Charm of Subtle Variation",
            desc: "Because it is hand-looped, each piece has subtle heirloom characteristics that make it uniquely yours. No two pieces are ever 100% identical.",
          },
          {
            title: "3. Packaged with Personal Care",
            desc: "Every order is wrapped in recyclable kraft tissue, sealed with studio twine, and accompanied by a handwritten note thanking you for supporting slow craft.",
          },
        ],
        conclusion:
          "Thank you for choosing handmade, slow craft, and intentional pieces that bring warmth into your everyday life.",
      },
    },
  ];

  const filteredPosts =
    activeFilter === "All"
      ? posts
      : posts.filter((p) => p.category === activeFilter);

  return (
    <StoreShell>
      {/* Intro Header */}
      <PageIntro
        eyebrow="Studio Notes & Care Guides"
        title="The Cozy Crochet Journal"
        text="Helpful guides on caring for your handmade pieces, yarn stories, and quiet notes from AJ's studio."
      />

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        {/* Clean Filter Tabs */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 border-b border-border pb-5">
          {["All", "Care Guide", "Yarn & Fibres", "Studio Story"].map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeFilter === tab ? "default" : "outline"}
              onClick={() => setActiveFilter(tab)}
              className="rounded-full px-4 text-xs font-semibold"
            >
              {tab === "All" ? "All Notes" : tab}
            </Button>
          ))}
        </div>

        {/* Clean, Uniform 3-Column Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card shadow-xs transition-all hover:shadow-md hover:border-primary/40"
            >
              <div>
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-card/95 backdrop-blur-xs px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary shadow-xs">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="size-3.5" /> {post.readTime}
                    </span>
                    <span>·</span>
                    <span>{post.date}</span>
                  </div>

                  <h2 className="mt-3 font-display text-xl font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Read Button */}
              <div className="px-6 pb-6 pt-2">
                <Button
                  variant="soft"
                  size="sm"
                  className="w-full justify-between text-xs font-bold"
                  onClick={() => setSelectedPost(post)}
                >
                  <span>Read full note</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        {/* Help Banner */}
        <div className="mt-16 rounded-3xl border border-primary/20 bg-primary/5 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Sparkles className="size-3.5" /> Have a Specific Care Question?
            </span>
            <h3 className="mt-1 font-display text-2xl font-medium">
              Need advice for a custom piece or stain removal?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              AJ is always happy to provide personalized care tips for any piece made in our studio.
            </p>
          </div>
          <Button size="lg" className="shrink-0" asChild>
            <a href="mailto:admin@cozycrochet.com?subject=Crochet Care Question for AJ">
              Ask AJ a Question
            </a>
          </Button>
        </div>
      </section>

      {/* Clean Reading Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-full"
              onClick={() => setSelectedPost(null)}
            >
              <X className="size-5" />
            </Button>

            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {selectedPost.category} · {selectedPost.readTime}
            </span>

            <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
              {selectedPost.title}
            </h2>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground font-medium">
              {selectedPost.fullContent.intro}
            </p>

            <div className="mt-6 space-y-4">
              {selectedPost.fullContent.points.map((pt, idx) => (
                <div key={idx} className="rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-5">
                  <h4 className="font-display text-lg font-medium text-foreground">{pt.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pt.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground italic">
              {selectedPost.fullContent.conclusion}
            </p>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedPost(null)}>Close Note</Button>
            </div>
          </div>
        </div>
      )}
    </StoreShell>
  );
}
