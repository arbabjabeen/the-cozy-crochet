"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Sparkles,
  Check,
  Star,
  ThumbsUp,
  ShieldCheck,
  MessageSquare,
  Send,
  Heart,
  User,
  CheckCircle2,
  Share2,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProductGrid, StoreShell } from "@/components/next-storefront";
import { money, products, type Product, type Review } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { fetchProductBySlug, addProductReview, fetchProducts } from "@/lib/api";
import { CustomOrderModal } from "@/components/custom-order-modal";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.["slug"] ?? "") as string;

  const [product, setProduct] = useState<Product | undefined>(() =>
    products.find((p) => p.slug === slug)
  );
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!product);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // Reviews & Rating states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({});
  const [userVoted, setUserVoted] = useState<Record<string, boolean>>({});

  const { addToCart } = useCart();

  useEffect(() => {
    if (slug) {
      if (!product) setLoading(true);
      fetchProductBySlug(slug)
        .then((p) => {
          if (p) {
            setProduct(p);
            setReviews(p.reviews || []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetchProducts()
        .then((all) => {
          if (Array.isArray(all)) {
            setRecommended(all.filter((x) => x.slug !== slug).slice(0, 4));
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  // Sync reviews when product changes
  useEffect(() => {
    if (product?.reviews) {
      setReviews(product.reviews);
    }
  }, [product]);

  // Rating metrics
  const reviewCount = reviews.length;
  const avgRating = useMemo(() => {
    if (reviewCount === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return Number((sum / reviewCount).toFixed(1));
  }, [reviews, reviewCount]);

  const starBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const ratingDescriptions: Record<number, string> = {
    5: "Masterpiece! Absolutely in love with this piece ⭐",
    4: "Very Good! High quality & neat stitches ✨",
    3: "Good! Satisfied with the handmade piece 👍",
    2: "Fair! Has some minor flaws 🧶",
    1: "Poor! Not as expected ⚠️",
  };

  const activeRating = hoverRating || rating;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setSubmitError("Please write a comment or review before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const res = await addProductReview(slug, {
      name: authorName.trim() || "Handmade Lover",
      rating,
      comment: comment.trim(),
    });

    setSubmitting(false);

    if (res.success && res.review) {
      setReviews((prev) => [res.review, ...prev]);
      setSubmitSuccess(true);
      setComment("");
      setAuthorName("");
      setTimeout(() => setSubmitSuccess(false), 5000);
    } else {
      setSubmitError(res.message || "Could not save your review. Please try again.");
    }
  };

  const handleHelpfulClick = (reviewId: string) => {
    if (userVoted[reviewId]) return;
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    setUserVoted((prev) => ({ ...prev, [reviewId]: true }));
  };

  const scrollToReviews = () => {
    const el = document.getElementById("customer-reviews");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-xl px-5 py-24 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </StoreShell>
    );
  }

  if (!product) {
    return (
      <StoreShell>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="font-display text-3xl font-medium">Piece Not Found</h1>
          <p className="mt-2 text-muted-foreground">The piece you're looking for might have been sold or moved.</p>
          <Button className="mt-6" asChild>
            <Link href="/shop">Browse All Pieces</Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const imageSrc =
    typeof product.image === "string"
      ? product.image
      : (product.image as any)?.src || "/assets/cloud-throw.jpg";

  const isSale = Boolean(
    product.onSale || (product.originalPrice && product.originalPrice > product.price)
  );
  const effectiveOriginal =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice
      : Math.round(product.price * 1.25);

  const discountPercent = isSale
    ? Math.round(((effectiveOriginal - product.price) / effectiveOriginal) * 100)
    : null;

  return (
    <StoreShell>
      {/* Product Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-8 sm:gap-12 px-4 sm:px-5 py-6 sm:py-12 md:grid-cols-2 lg:px-8">
        <div className="relative">
          <img
            src={imageSrc}
            alt={product.name}
            width={912}
            height={912}
            className="aspect-square w-full rounded-2xl sm:rounded-3xl object-cover shadow-sm ring-1 border border-border"
          />
          {product.badge && (
            <span className="absolute left-3.5 top-3.5 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-xs border border-border">
              {product.badge}
            </span>
          )}
          {isSale && (
            <span className="absolute right-3.5 top-3.5 rounded-full bg-rose-600 text-white px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              🔥 {discountPercent ? `-${discountPercent}% SALE` : "SALE"}
            </span>
          )}
        </div>

        <div className="md:py-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {product.category}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="size-3 sm:size-3.5" /> 100% Handcrafted
              </span>
            </div>

            <h1 className="mt-2 font-display text-2xl sm:text-4xl lg:text-5xl font-medium">{product.name}</h1>

            {/* Price & Rating Badge Bar */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-baseline gap-2.5">
                <p className={`font-display text-2xl sm:text-3xl font-medium ${isSale ? "text-rose-600 dark:text-rose-400 font-bold" : "text-primary"}`}>
                  {money(product.price)}
                </p>
                {isSale && (
                  <>
                    <span className="text-base sm:text-lg text-muted-foreground line-through">
                      {money(effectiveOriginal)}
                    </span>
                    <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 border border-rose-200 dark:border-rose-800">
                      Save {money(effectiveOriginal - product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Clickable star summary */}
              <button
                type="button"
                onClick={scrollToReviews}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 sm:px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`size-3.5 ${
                        s <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-amber-200 dark:text-amber-800"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </button>
            </div>

            <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              {product.description} Each piece is hand-looped with high-grade natural yarn, giving it subtle heirloom variations that make it completely unique.
            </p>

            {/* Add to Bag and Buy Now Direct Order */}
            <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex items-center rounded-xl border border-border bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Decrease quantity"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-9 sm:w-10 text-center font-bold text-sm sm:text-base">{qty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Increase quantity"
                    onClick={() => setQty(qty + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="flex-1 sm:flex-initial sm:px-6 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-sm border-2 border-primary/40 bg-card text-foreground hover:bg-secondary hover:text-foreground"
                  onClick={handleAddToCart}
                >
                  {added ? (
                    <>
                      <Check className="mr-1.5 sm:mr-2 size-4 text-emerald-600" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-1.5 sm:mr-2 size-4" /> Add to Cart
                    </>
                  )}
                </Button>
              </div>

              <Button
                className="w-full sm:flex-1 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-md bg-emerald-700 hover:bg-emerald-800 text-white"
                onClick={() => {
                  if (product) {
                    addToCart(product, qty, undefined, true);
                    router.push("/checkout");
                  }
                }}
              >
                <Zap className="mr-2 size-4" /> Buy Now
              </Button>
            </div>

            {/* Customization Callout */}
            <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-foreground">Want this piece in a custom color or style?</p>
                <p className="text-muted-foreground">AJ takes custom commissions crafted to your exact specifications.</p>
              </div>
              <Button
                size="sm"
                variant="soft"
                className="ml-3 shrink-0"
                onClick={() => setCustomModalOpen(true)}
              >
                <Sparkles className="mr-1.5 size-3.5 text-primary" /> Customize
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS & RATINGS SECTION */}
      <section
        id="customer-reviews"
        className="mx-auto max-w-7xl px-5 py-16 lg:px-8 border-t border-border scroll-mt-20"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-3">
            <Heart className="size-3.5 fill-primary" /> Customer Love & Feedback
          </span>
          <h2 className="font-display text-3xl font-medium sm:text-4xl text-foreground">
            Ratings & Customer Reviews
          </h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Verified opinions from crochet collectors and customers. Each review is saved directly to our artisan records.
          </p>
        </div>

        {/* Rating Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Score & Stars */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-center items-center text-center shadow-xs">
            <span className="text-5xl font-extrabold text-foreground tracking-tight">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 my-3 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-6 ${
                    s <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-200 dark:text-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">
              Based on {reviewCount} {reviewCount === 1 ? "verified review" : "verified reviews"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ⭐ 100% of customers love this handcrafted item
            </p>
          </div>

          {/* Card 2: Star Breakdown Progress Bars */}
          <div className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-center shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Rating Breakdown
            </p>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((starNum) => {
                const count = starBreakdown[starNum] || 0;
                const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                return (
                  <div key={starNum} className="flex items-center gap-2 text-xs">
                    <span className="w-12 font-medium text-muted-foreground flex items-center gap-1">
                      {starNum} <Star className="size-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Artisan Guarantee & Write CTA */}
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 flex flex-col justify-between shadow-xs">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" /> Handmade Guarantee
              </p>
              <p className="text-sm font-semibold text-foreground">
                Crafted with Heirloom Yarn & Tight Stitches
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                AJ personally loops every stitch. Have you received this piece? Share your thoughts below and help other crochet lovers!
              </p>
            </div>
            <a
              href="#write-review"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all text-center"
            >
              <MessageSquare className="size-3.5" /> Write a Review
            </a>
          </div>
        </div>

        {/* Two Column Layout: Write Review Form & Existing Reviews List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Write a Review Form (lg:col-span-5) */}
          <div
            id="write-review"
            className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs sticky top-24"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Star className="size-4 fill-primary" />
              </span>
              <h3 className="text-lg font-bold text-foreground">Add Your Review</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Your feedback is stored directly in our database and helps AJ create even more beautiful designs.
            </p>

            {submitSuccess && (
              <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-bold">Thank you for your review! 🎉</p>
                  <p className="mt-0.5">Your 5-star rating and comment have been stored permanently in our database.</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-4 text-rose-800 dark:text-rose-200 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Overall Rating <span className="text-primary">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= activeRating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                        aria-label={`${starValue} Stars`}
                      >
                        <Star
                          className={`size-7 transition-colors ${
                            isFilled
                              ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                              : "text-muted-foreground/30 hover:text-amber-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 font-display text-base font-bold text-foreground">
                    {activeRating} / 5
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {ratingDescriptions[activeRating] || "Click to rate"}
                </p>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-10 pr-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Comment / Review Body */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Your Review / Comment <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-6 font-bold text-sm shadow-sm gap-2"
              >
                {submitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Saving Review to DB...
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Submit Customer Review
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Customer Reviews Feed (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                Customer Comments ({reviews.length})
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                Sorted by Most Recent
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/50">
                <MessageSquare className="size-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-base font-semibold text-foreground">No reviews yet for this piece</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Be the first to share your thoughts and help AJ's handmade community flourish!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev, idx) => {
                  const initial = (rev.name || "C").trim().charAt(0).toUpperCase();
                  const formattedDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Recently";

                  const helpfulVotes = (helpfulMap[rev._id] || 0);
                  const isVoted = userVoted[rev._id];

                  return (
                    <div
                      key={rev._id || idx}
                      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar with initial */}
                          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shadow-xs border border-primary/20">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-foreground">
                                {rev.name || "Handmade Lover"}
                              </h4>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <Check className="size-3" /> Verified Buyer
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {formattedDate}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3.5 ${
                                s <= (Number(rev.rating) || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="mt-3.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {rev.comment}
                      </p>

                      {/* Helpful Button Footer */}
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="text-[11px]">
                          Handmade piece reviewed on The Cozy Crochet
                        </span>
                        <button
                          type="button"
                          onClick={() => handleHelpfulClick(rev._id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                            isVoted
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <ThumbsUp className={`size-3.5 ${isVoted ? "fill-primary" : ""}`} />
                          <span>Helpful</span>
                          {helpfulVotes > 0 && <span>({helpfulVotes})</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended items */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 border-t border-border mt-8">
        <h2 className="mb-7 font-display text-3xl font-medium">You may also love</h2>
        <ProductGrid items={recommended.length > 0 ? recommended : products.filter((x) => x.slug !== product.slug).slice(0, 4)} />
      </section>

      <CustomOrderModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        initialProductType={product.category}
      />
    </StoreShell>
  );
}
