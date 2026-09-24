"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  MessageCircle,
  Clock,
  Heart,
  ShieldCheck,
  Plus,
  Minus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitCustomOrder } from "@/lib/api";
import { toast } from "sonner";

interface CustomOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductType?: string;
}

export function CustomOrderModal({
  open,
  onOpenChange,
  initialProductType = "",
}: CustomOrderModalProps) {
  const [productType, setProductType] = useState(initialProductType);
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

    setSubmitting(true);
    try {
      const res = await submitCustomOrder({
        customerName: finalCustomerName,
        customerEmail,
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

        // Persist to localStorage for real-time admin sync
        try {
          const existing = JSON.parse(localStorage.getItem("cozy_studio_custom_orders") || "[]");
          const updated = [
            res.customOrder,
            ...existing.filter((co: any) => co.customOrderId !== res.customOrder.customOrderId),
          ];
          localStorage.setItem("cozy_studio_custom_orders", JSON.stringify(updated.slice(0, 50)));
        } catch {}

        toast.success("Custom order submitted! AJ will reach out shortly.");
      }
    } catch {
      toast.error("Failed to submit custom order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setConfirmedOrder(null);
    setProductType("");
    setColorPreference("");
    setInstructions("");
    setReferenceImage("");
    onOpenChange(false);
  };

  const displayName = customerName && !/^[\d\s+\-()]{6,}$/.test(customerName.trim()) ? customerName : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl transition-all focus:outline-hidden">
          {/* Close button */}
          <Dialog.Close
            className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </Dialog.Close>

          {confirmedOrder ? (
            <div className="py-6 text-center animate-in fade-in zoom-in-95">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
                <CheckCircle2 className="size-9 text-primary" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Request Confirmed · {confirmedOrder.id}
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">
                Custom Order Received!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground">
                Thank you{displayName ? `, ${displayName}` : ""}! Your custom
                crochet request for <strong className="text-foreground">{productType}</strong> has been
                received. AJ will review your specifications and contact you via WhatsApp shortly.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto shadow-md" asChild>
                  <a href={confirmedOrder.whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 size-5" /> Chat with AJ on WhatsApp
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={resetForm}>
                  Close & Continue Browsing
                </Button>
              </div>

              {/* Order details summary */}
              <div className="mt-8 rounded-2xl border border-border bg-secondary/30 p-5 text-left text-xs sm:text-sm">
                <p className="font-bold text-foreground">Order Specifications</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground">Item to Make:</span>
                    <p className="font-semibold text-foreground">{productType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color:</span>
                    <p className="font-semibold text-foreground">{colorPreference}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <p className="font-semibold text-foreground">{quantity} piece(s)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Date:</span>
                    <p className="font-semibold text-foreground">{targetDate || "Flexible"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="border-b border-border pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3.5" /> Bespoke Studio
                </div>
                <Dialog.Title className="mt-2 font-display text-2xl font-medium">
                  Customize a Piece
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Handmade by AJ to your exact request.
                </Dialog.Description>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* 1. What to make */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    What to make *
                  </label>
                  <Input
                    className="mt-1.5"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    required
                  />
                </div>

                {/* 2. Color */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Color preference *
                  </label>
                  <Input
                    className="mt-1.5"
                    value={colorPreference}
                    onChange={(e) => setColorPreference(e.target.value)}
                    required
                  />
                </div>

                {/* 3. Quantity & Target Date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Quantity
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
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
                        <span className="w-8 text-center text-xs font-bold">{quantity}</span>
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
                      <span className="text-[11px] text-muted-foreground">piece(s)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Target Date (Optional)
                    </label>
                    <Input
                      className="mt-1.5"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 5. Reference Image Upload */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reference Photo (Optional)
                  </label>
                  <div className="mt-1.5 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/50 p-4 text-center transition-colors hover:border-primary">
                    {referenceImage ? (
                      <div className="relative w-full">
                        <img
                          src={referenceImage}
                          alt="Reference preview"
                          className="max-h-36 mx-auto rounded-lg object-contain"
                        />
                        <Button
                          type="button"
                          variant="soft"
                          size="sm"
                          className="mt-2 w-full text-xs"
                          onClick={() => setReferenceImage("")}
                        >
                          Remove Photo
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="size-5 text-primary" />
                        <span className="mt-1 text-xs font-medium">Attach photo (optional)</span>
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

                {/* 6. Additional Instructions */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Special Instructions (Optional)
                  </label>
                  <Textarea
                    className="mt-1.5"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* 7. Contact Details */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Your Contact Details
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                      </label>
                      <Input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
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

                {/* Submit Action */}
                <div className="border-t border-border pt-4 flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-5 text-sm font-bold shadow-md hover:scale-[1.02] transition-transform"
                  >
                    {submitting ? "Sending Request..." : "Request Custom Order"}
                    <Send className="ml-2 size-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
