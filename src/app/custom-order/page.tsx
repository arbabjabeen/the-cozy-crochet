"use client";

import Link from "next/link";
import {
  Sparkles,
  Upload,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Plus,
  Minus,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoreShell } from "@/components/next-storefront";
import { submitCustomOrder } from "@/lib/api";
import { toast } from "sonner";

export default function CustomOrderPage() {
  const [productType, setProductType] = useState("");
  const [colorPreference, setColorPreference] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [instructions, setInstructions] = useState("");
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

    if (!productType.trim()) {
      toast.error("Please enter what you would like made.");
      return;
    }

    if (!colorPreference.trim()) {
      toast.error("Please enter your desired color.");
      return;
    }

    let finalCustomerName = customerName.trim();
    let finalCustomerPhone = customerPhone.trim();

    // Auto-detect if customer swapped name and phone
    if (/^[\d\s+\-()]{6,}$/.test(finalCustomerName) && /[a-zA-Z]/.test(finalCustomerPhone)) {
      const temp = finalCustomerName;
      finalCustomerName = finalCustomerPhone;
      finalCustomerPhone = temp;
    }

    if (!finalCustomerName || !finalCustomerPhone) {
      toast.error("Please fill in your name and phone number.");
      return;
    }

    const cleanEmail =
      customerEmail.trim() ||
      `customer-${finalCustomerPhone.replace(/\D/g, "").slice(-7) || Date.now()}@cozycrochet.com`;

    setSubmitting(true);
    try {
      const res = await submitCustomOrder({
        customerName: finalCustomerName,
        customerEmail: cleanEmail,
        customerPhone: finalCustomerPhone,
        productType,
        colorPreference,
        sizeDimensions: "Standard",
        designStyle: "Custom Request",
        quantity,
        referenceImage,
        instructions,
        targetDate,
      });

      if (res.success) {
        setConfirmedOrder({
          id: res.customOrder.customOrderId,
          whatsappUrl: res.whatsappUrl,
        });
        toast.success("Your custom order request has been submitted!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const displayName = customerName && !/^[\d\s+\-()]{6,}$/.test(customerName.trim()) ? customerName : "";

    return (
      <StoreShell>
        <section className="mx-auto max-w-xl px-5 py-20 text-center lg:px-8">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-medium">Request Received!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you{displayName ? `, ${displayName}` : ""}!
            AJ has received your request ({confirmedOrder.id}) and will review your specifications.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <a href={confirmedOrder.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 size-4" /> Message AJ on WhatsApp
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
              <Link href="/shop">Browse Store</Link>
            </Button>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-2xl px-5 pt-6 pb-20 lg:px-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">Customize a Piece</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Handmade according to your choice</p>
          </div>
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            ✨ Bespoke
          </span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-6">
          {/* Item & Color */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                What to make *
              </label>
              <Input
                required
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Color preference *
              </label>
              <Input
                required
                value={colorPreference}
                onChange={(e) => setColorPreference(e.target.value)}
              />
            </div>
          </div>

          {/* Quantity & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border bg-background">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">Piece(s)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Date (Optional)
              </label>
              <Input
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reference Photo & Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reference Photo (Optional)
            </label>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-4 text-center hover:border-primary transition-colors">
              {referenceImage ? (
                <div className="relative w-full">
                  <img
                    src={referenceImage}
                    alt="Reference upload"
                    className="max-h-36 w-full rounded-xl object-contain mx-auto"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-destructive"
                    onClick={() => setReferenceImage("")}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Upload className="size-4 text-primary" />
                  <span className="text-xs font-medium">Attach photo (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Special Instructions (Optional)
            </label>
            <Textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Contact Details */}
          <div className="pt-2 border-t border-border space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Contact Information
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Phone / WhatsApp <span className="text-red-500">*</span>
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

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full font-bold shadow-sm"
          >
            {submitting ? "Submitting..." : "Submit Custom Request"}{" "}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>
      </section>
    </StoreShell>
  );
}
