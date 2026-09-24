"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreShell } from "@/components/next-storefront";
import { money } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { placeOrder } from "@/lib/api";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, subtotal, giftWrap, clearCart } = useCart();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Pre-fill user information ONLY if logged in as a normal buyer/customer (never admin AJ)
  useEffect(() => {
    if (user && user.role !== "admin" && user.email !== "arbabjabeen2006@gmail.com") {
      if (!fullName) setFullName(user.name || "");
      if (!email) setEmail(user.email || "");
      if (!phone && user.phone) setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your bag is empty! Please add a piece first.");
      return;
    }

    let cleanFullName = fullName.trim();
    let cleanPhone = phone.trim();

    // Auto-detect if customer swapped name and phone
    if (/^[\d\s+\-()]{6,}$/.test(cleanFullName) && /[a-zA-Z]/.test(cleanPhone)) {
      const temp = cleanFullName;
      cleanFullName = cleanPhone;
      cleanPhone = temp;
    }

    if (!cleanFullName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!cleanPhone) {
      toast.error("Please enter your phone number.");
      return;
    }

    if (!street.trim()) {
      toast.error("Please enter your delivery street address.");
      return;
    }

    if (!city.trim()) {
      toast.error("Please enter your city.");
      return;
    }

    // Default email if user didn't provide one
    const cleanEmail =
      email.trim() ||
      `customer-${cleanPhone.replace(/\D/g, "").slice(-7) || Date.now()}@cozycrochet.com`;

    setSubmitting(true);
    try {
      const orderPayload = {
        customer: {
          name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
        },
        items: items.map((i) => {
          const imgSrc =
            typeof i.product.image === "string"
              ? i.product.image
              : (i.product.image as any)?.src || "/assets/cloud-throw.jpg";
          return {
            slug: i.product.slug,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            image: imgSrc,
          };
        }),
        shippingAddress: {
          fullName: cleanFullName || user?.name || "Valued Customer",
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim() || "00000",
        },
        paymentMethod: "WhatsApp / Direct Transfer",
        subtotal,
        giftWrap,
        total: subtotal,
      };

      const result = await placeOrder(orderPayload);
      setPlacedOrder(result);
      clearCart();
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to complete order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    const orderNum = placedOrder.orderNumber || "Pending";
    const customerFullName = placedOrder.shippingAddress?.fullName || fullName || "Valued Customer";
    const orderTotal = placedOrder.total || subtotal;
    const itemsList = placedOrder.items
      ? placedOrder.items.map((it: any) => `${it.name} (x${it.quantity})`).join(", ")
      : "Handcrafted Crochet Piece";

    const isPhoneDigits = (val: string) => /^[\d\s+\-()]{6,}$/.test(val.trim());
    const cleanDisplayName = customerFullName && !isPhoneDigits(customerFullName) ? customerFullName : "";

    const waText = `Assalam-o-Alaikum AJ! 🌸\nI just placed an order on The Cozy Crochet:\n• Order: ${orderNum}\n• Customer: ${customerFullName}\n• Phone: ${phone}\n• Items: ${itemsList}\n• Total Amount: ${money(orderTotal)}\n• Address: ${street}, ${city}\n\nPlease share your EasyPaisa / JazzCash / Bank account details for payment transfer, and confirm my order. Thank you! 🧶✨`;
    const waUrl = `https://wa.me/923207309867?text=${encodeURIComponent(waText)}`;

    return (
      <StoreShell>
        <section className="mx-auto max-w-xl px-5 py-16 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-md">
            <CheckCircle2 className="size-12" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              ✓ Order Status: Received & Registered
            </span>
          </div>

          <h1 className="mt-3 font-display text-3xl font-medium sm:text-5xl text-foreground">
            Order Placed Successfully!
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Order Reference: {orderNum}
          </p>

          <p className="mt-4 leading-relaxed text-muted-foreground text-sm sm:text-base">
            Thank you{cleanDisplayName ? `, ${cleanDisplayName}` : ""}!
            Your order has been registered in our studio. Please contact AJ on WhatsApp below to confirm details.
          </p>

          {/* Order total summary */}
          <div className="mt-6 rounded-2xl bg-secondary/60 border border-border p-5 max-w-md mx-auto text-left text-sm text-foreground">
            <div className="flex items-center justify-between text-base">
              <span className="font-medium text-muted-foreground">Total Amount:</span>
              <strong className="text-primary text-xl font-bold">{money(orderTotal)}</strong>
            </div>
          </div>

          {/* WhatsApp Direct Action Button */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="w-full max-w-md py-6 text-sm sm:text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-md rounded-2xl cursor-pointer"
              asChild
            >
              <a href={waUrl} target="_blank" rel="noreferrer">
                💬 Chat on WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-8">
            <Button variant="outline" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
              <Link href="/shop">
                Continue Shopping <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </StoreShell>
    );
  }

  if (items.length === 0) {
    return (
      <StoreShell>
        <section className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-primary">
            <ShoppingBag className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-medium">Your Bag is Empty</h1>
          <Button className="mt-6 font-bold" asChild>
            <Link href="/shop">Explore Collection</Link>
          </Button>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl sm:text-4xl font-medium">Checkout</h1>

        <div className="mt-8 grid gap-10 md:grid-cols-[1.4fr_0.8fr]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Contact Details */}
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">
                Contact Information
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
              <h2 className="mb-4 font-display text-lg font-bold text-foreground">
                Delivery Address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Postal Code
                  </label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full py-7 text-base font-bold shadow-md bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer rounded-2xl"
              size="lg"
              type="submit"
              disabled={submitting}
            >
              <CheckCircle2 className="mr-2 size-5" />
              {submitting
                ? "Placing Your Order..."
                : `Confirm Order · ${money(subtotal)}`}
            </Button>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="h-fit rounded-3xl bg-card p-6 ring-1 border-border shadow-xs">
            <h2 className="font-display text-2xl font-medium">Your order</h2>
            <div className="mt-5 divide-y divide-border">
              {items.map(({ product: p, quantity: q, color }) => {
                const imgSrc =
                  typeof p.image === "string"
                    ? p.image
                    : (p.image as any)?.src || "/assets/cloud-throw.jpg";

                return (
                  <div key={p.slug} className="flex gap-3 py-4">
                    <img src={imgSrc} alt="" className="size-16 rounded-xl object-cover ring-1 ring-border" />
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {q} · {color || "Handcrafted"}
                      </p>
                    </div>
                    <strong className="ml-auto text-sm">{money(p.price * q)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kraft Gift Wrap</span>
                <span className="text-primary font-semibold">Complimentary</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Method</span>
                <span className="text-foreground font-semibold">Standard Courier</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-bold text-base">
                <span>Total Amount</span>
                <span className="text-primary text-xl">{money(subtotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
