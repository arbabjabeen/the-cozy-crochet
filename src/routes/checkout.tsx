import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Lock, CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreShell } from "@/components/storefront";
import { money } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — The Cozy Crochet" },
      { name: "description", content: "Complete your handmade crochet order." },
      { property: "og:title", content: "Checkout — The Cozy Crochet" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { items, subtotal, giftWrap, clearCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your bag is empty!");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customer: { name: fullName, email, phone },
        items: items.map((i) => ({
          slug: i.product.slug,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image,
        })),
        shippingAddress: { fullName, street, city, postalCode },
        paymentMethod: "Credit Card / Cash on Delivery",
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
    return (
      <StoreShell>
        <section className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-10 text-primary" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Order Confirmed · {placedOrder.orderNumber}
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
            Your order is all wrapped up.
          </h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Thank you, <strong className="text-foreground">{placedOrder.shippingAddress?.fullName || fullName}</strong>!
            We've sent an order confirmation to <strong className="text-foreground">{placedOrder.customer?.email || email}</strong>.
            Your pieces will be hand-finished, boxed with kraft wrap, and dispatched in 3–5 business days.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/shop" search={{ category: "All" }}>
                Continue Shopping <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/admin/orders">View in Studio Admin</Link>
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
          <h1 className="mt-5 font-display text-3xl font-medium">Your bag is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some lovely crochet pieces before checking out.</p>
          <Button className="mt-6" asChild>
            <Link to="/shop" search={{ category: "All" }}>
              Shop Now
            </Link>
          </Button>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl font-medium sm:text-5xl">Almost yours.</h1>

        <div className="mt-10 grid gap-12 md:grid-cols-[1.4fr_0.8fr]">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Contact Details */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-medium">Contact information</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  required
                  type="tel"
                  className="sm:col-span-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Delivery address */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-medium">Delivery address</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  required
                  className="sm:col-span-2"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <Input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="mb-4 font-display text-2xl font-medium">Payment & Packaging</h2>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CreditCard className="size-4 text-primary" /> Payment Method
                  </p>
                  <span className="text-xs font-semibold text-primary">WhatsApp / Direct Transfer</span>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" type="submit" disabled={submitting}>
              <Lock className="mr-2 size-4" />
              {submitting ? "Placing Order..." : `Place Order · ${money(subtotal)}`}
            </Button>
          </form>

          {/* Order Summary Sidebar */}
          <aside className="h-fit rounded-3xl bg-card p-6 ring-1 ring-border shadow-xs">
            <h2 className="font-display text-2xl font-medium">Your order</h2>
            <div className="mt-5 divide-y divide-border">
              {items.map(({ product: p, quantity: q, color }) => (
                <div key={p.slug} className="flex gap-3 py-4">
                  <img src={p.image} alt="" className="size-16 rounded-xl object-cover ring-1 ring-border" />
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {q} · {color || "Sage"}
                    </p>
                  </div>
                  <strong className="ml-auto text-sm">{money(p.price * q)}</strong>
                </div>
              ))}
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
                <span>Delivery</span>
                <span className="text-primary font-semibold">Free</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-bold text-base">
                <span>Total</span>
                <span className="text-primary text-xl">{money(subtotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}