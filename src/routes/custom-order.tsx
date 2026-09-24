import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Clock,
  Heart,
  ShieldCheck,
  Plus,
  Minus,
  ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoreShell } from "@/components/storefront";
import { submitCustomOrder } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/custom-order")({
  head: () => ({
    meta: [
      { title: "Customize According to Your Choice — The Cozy Crochet" },
      {
        name: "description",
        content:
          "Request a bespoke handmade crochet piece crafted specifically for you. Choose yarn, colors, size, and pattern.",
      },
    ],
  }),
  component: CustomOrderPage,
});

const productTypes = [
  { id: "Blanket", label: "Blanket / Throw", desc: "For beds, sofas & nursery" },
  { id: "Bag", label: "Market / Tote Bag", desc: "Open-weave, sturdy handles" },
  { id: "Amigurumi", label: "Amigurumi / Plush", desc: "Heirloom toys & keepsakes" },
  { id: "Wearable / Beanie", label: "Wearable / Beanie", desc: "Cozy hats, scarves, cardigans" },
  { id: "Home Decor", label: "Home Decor", desc: "Coasters, plant holders, cushions" },
  { id: "Other", label: "Special Custom", desc: "Your unique creative idea" },
];

const paletteOptions = [
  { name: "Muted Sage", color: "bg-[#738b71]" },
  { name: "Natural Cream", color: "bg-[#f5f2eb] border border-border" },
  { name: "Warm Terracotta", color: "bg-[#c87d55]" },
  { name: "Mustard Ochre", color: "bg-[#d8a34a]" },
  { name: "Dusty Lavender", color: "bg-[#a699b8]" },
  { name: "Charcoal Slate", color: "bg-[#4a4e51]" },
];

const designStyles = [
  "Minimalist & Ribbed",
  "Classic Granny Square",
  "Waffle Stitch Texture",
  "Delicate Lace & Openwork",
  "Floral / Botanical Appliques",
  "Maker's Artistic Choice",
];

function CustomOrderPage() {
  const [productType, setProductType] = useState("Blanket");
  const [colorPreference, setColorPreference] = useState("Muted Sage & Natural Cream");
  const [sizeDimensions, setSizeDimensions] = useState("Standard / Medium");
  const [designStyle, setDesignStyle] = useState("Minimalist & Ribbed");
  const [quantity, setQuantity] = useState(1);
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("$60 - $120");
  const [targetDate, setTargetDate] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    whatsappUrl: string;
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        toast.success("Reference photo attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCustomOrder({
        customerName,
        customerEmail,
        customerPhone,
        productType,
        colorPreference,
        sizeDimensions,
        designStyle,
        quantity,
        referenceImage,
        instructions,
        estimatedBudget,
        targetDate,
      });

      if (res.success) {
        setConfirmedOrder({
          id: res.customOrder.customOrderId,
          whatsappUrl: res.whatsappUrl,
        });
        toast.success("Your bespoke crochet order request was submitted!");
      }
    } catch {
      toast.error("There was an issue sending your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <StoreShell>
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-9 text-primary" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Request Confirmed · {confirmedOrder.id}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
            We received your custom piece request!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Thank you, <strong className="text-foreground">{customerName}</strong>. Maya and our studio
            makers will review your specifications, color palette, and pattern preferences. We will email
            you at <strong className="text-foreground">{customerEmail}</strong> within 24 hours with yarn
            swatches and an exact estimate.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <a href={confirmedOrder.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 size-5" /> Chat with Maker on WhatsApp
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                setConfirmedOrder(null);
                setInstructions("");
                setReferenceImage("");
              }}
            >
              Submit Another Request
            </Button>
          </div>

          <div className="mt-14 rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
            <h3 className="font-display text-lg font-medium">Request Summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <span className="text-xs uppercase text-muted-foreground">Item Type</span>
                <p className="font-bold">{productType}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Palette</span>
                <p className="font-bold">{colorPreference}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Style</span>
                <p className="font-bold">{designStyle}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Quantity</span>
                <p className="font-bold">{quantity} piece(s)</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Size</span>
                <p className="font-bold">{sizeDimensions}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Estimated Budget</span>
                <p className="font-bold">{estimatedBudget || "Flexible"}</p>
              </div>
            </div>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      {/* Hero Header */}
      <section className="border-b border-border/70 bg-secondary/30 py-14">
        <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-xs ring-1 ring-border">
            <Sparkles className="size-3.5 text-primary" /> Made Especially For You
          </div>
          <h1 className="mt-4 font-display text-4xl font-medium sm:text-5xl lg:text-6xl">
            Customize According to Your Choice
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Have a dream blanket, a customized amigurumi character, or a bag in your favourite hues?
            Share your details below. We hand-crochet every loop according to your personal vision.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-semibold text-muted-foreground">
            <span className="flex items-center gap-2">
              <Heart className="size-4 text-primary" /> 100% Handcrafted
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-primary" /> 7–14 Days Crafting Time
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Maker Consultation
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Form */}
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Step 1: Product Type */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <h2 className="font-display text-2xl font-medium">What would you like made?</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Select the base crochet category for your bespoke creation.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {productTypes.map((item) => {
                const isSelected = productType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProductType(item.id)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-secondary/40"
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Color Palette & Yarn Preference */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <h2 className="font-display text-2xl font-medium">Colours & Yarn Palette</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose from our signature natural studio tones or specify your own custom combination.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {paletteOptions.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => {
                    setColorPreference(palette.name);
                    toast.info(`Selected: ${palette.name}`);
                  }}
                  className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                    colorPreference.includes(palette.name)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className={`size-3.5 rounded-full ${palette.color}`} />
                  {palette.name}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Custom Color Description / Combination
              </label>
              <Input
                value={colorPreference}
                onChange={(e) => setColorPreference(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Step 3: Size, Pattern & Quantity */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <h2 className="font-display text-2xl font-medium">Size, Stitch Pattern & Quantity</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Specify the scale and crochet stitch texture you love.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Size / Dimensions
                </label>
                <Input
                  value={sizeDimensions}
                  onChange={(e) => setSizeDimensions(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stitch / Design Style
                </label>
                <select
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {designStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border bg-background">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-10 text-center font-bold">{quantity}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">Hand-stitched pieces</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Date / Urgency (Optional)
                </label>
                <Input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 4: Reference Image & Instructions */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <h2 className="font-display text-2xl font-medium">Reference Image & Special Instructions</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Have an inspiration picture from Pinterest or Instagram? Upload it here so Maya can match the exact design!
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Image Upload Box */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Upload Reference Photo
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary">
                  {referenceImage ? (
                    <div className="relative w-full">
                      <img
                        src={referenceImage}
                        alt="Reference upload"
                        className="max-h-48 w-full rounded-xl object-contain"
                      />
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => setReferenceImage("")}
                      >
                        Remove & Upload Another
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid size-12 place-items-center rounded-full bg-secondary text-primary">
                        <Upload className="size-6" />
                      </div>
                      <p className="mt-3 text-sm font-bold">Upload an image or screenshot</p>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WEBP up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Additional Notes & Instructions
                </label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </div>

          {/* Step 5: Contact Details */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                5
              </span>
              <h2 className="font-display text-2xl font-medium">Your Contact Details</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Where can AJ send the custom quote, swatch photos, and updates?
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">Full Name *</label>
                <Input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">Email Address *</label>
                <Input
                  required
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">
                  Phone / WhatsApp Number *
                </label>
                <Input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="rounded-3xl bg-secondary p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-medium">Ready to create your one-of-a-kind piece?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No payment is taken today. AJ will review your request and send a personalized quote.
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-4 sm:mt-0 w-full sm:w-auto px-8 py-6 text-base font-bold shadow-md hover:scale-[1.02] transition-transform"
            >
              {submitting ? "Sending Request..." : "Request Custom Order"} <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </form>
      </section>
    </StoreShell>
  );
}
