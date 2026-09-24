import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreShell } from "@/components/storefront";
import { useAuth } from "@/context/AuthContext";
import { Package, UserCheck, LogOut, Sparkles } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — The Cozy Crochet" },
      { name: "description", content: "Sign in to view your crochet orders and saved details." },
      { property: "og:title", content: "My Account — The Cozy Crochet" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, login, register, logout, isAdmin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isRegister) {
      await register(name, email, password, phone);
    } else {
      await login(email, password);
    }
    setLoading(false);
  };

  if (user) {
    return (
      <StoreShell>
        <section className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    {user.role === "admin" ? "Studio Maker / Admin" : "Studio Member"}
                  </p>
                  <h1 className="font-display text-3xl font-medium">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <Button variant="default" size="sm" asChild>
                    <Link to="/admin">Studio Admin</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="mr-1.5 size-4" /> Sign out
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary/50 p-5">
                <h3 className="font-display font-medium text-lg flex items-center gap-2">
                  <Package className="size-4 text-primary" /> Recent Orders
                </h3>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <p className="flex justify-between border-b border-border/60 py-2">
                    <span>Order #CC-2047</span>
                    <strong className="text-primary">Delivered</strong>
                  </p>
                  <p className="flex justify-between py-2">
                    <span>Custom Piece #CUST-101</span>
                    <strong className="text-accent">In Review</strong>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-secondary/50 p-5">
                <h3 className="font-display font-medium text-lg flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Custom Commissions
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Have a new custom blanket or amigurumi vision? You can request a bespoke order anytime.
                </p>
                <Button size="sm" className="mt-4 w-full" asChild>
                  <Link to="/custom-order">Request New Custom Piece</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <section className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {isRegister ? "Join Our Community" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-center font-display text-4xl font-medium">
            {isRegister ? "Create an account" : "Your cosy corner."}
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
            {isRegister
              ? "Sign up to track orders, save your delivery addresses and request custom pieces."
              : "Sign in to see orders, addresses, and your saved crochet favourites."}
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </>
            )}
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-foreground hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                New to The Cozy Crochet?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-foreground hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}