"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreShell } from "@/components/next-storefront";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  LogOut,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, login, register, logout, isAdmin, initialized } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isRegister) {
      const res = await register({
        name,
        email,
        password,
        phone,
      });

      setLoading(false);
      if (res.success && res.user) {
        if (res.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      } else {
        setErrorMsg(res.message || "Registration failed");
      }
    } else {
      const res = await login(email, password);
      setLoading(false);
      if (res.success && res.user) {
        if (res.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      } else {
        setErrorMsg(res.message || "Invalid email or password");
      }
    }
  };

  if (!initialized) {
    return (
      <StoreShell>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </StoreShell>
    );
  }

  // LOGGED IN VIEW
  if (user) {
    return (
      <StoreShell>
        <section className="mx-auto max-w-4xl px-5 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xs">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">
                      {isAdmin ? "Studio Maker & Administrator" : "Customer Member"}
                    </span>
                  </div>
                  <h1 className="font-display text-3xl font-medium mt-1">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <Button variant="outline" size="sm" className="bg-card text-foreground hover:bg-secondary hover:text-foreground" onClick={logout}>
                  <LogOut className="mr-1.5 size-4" /> Sign out
                </Button>
              </div>
            </div>

            {/* Account section */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-secondary/50 p-6 border border-border/60">
                  <h3 className="font-display font-medium text-lg flex items-center gap-2">
                    <Package className="size-4 text-primary" /> Your Recent Orders
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <p className="text-xs text-muted-foreground">
                      Track and view all orders placed under your account.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-card text-foreground hover:bg-secondary hover:text-foreground" asChild>
                    <Link href="/shop">Browse Storefront</Link>
                  </Button>
                </div>

                <div className="rounded-2xl bg-primary/5 p-6 border border-primary/20 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-medium text-lg flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" /> Custom Commissions
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Have a bespoke crochet blanket, bag, or amigurumi vision? Studio Maker AJ will handcraft it to your exact specifications.
                    </p>
                  </div>
                  <Button size="sm" className="mt-4 w-full" asChild>
                    <Link href="/custom-order">Request Custom Piece</Link>
                  </Button>
                </div>
              </div>
          </div>
        </section>
      </StoreShell>
    );
  }

  // SIGN IN / REGISTER FORM
  return (
    <StoreShell>
      <section className="mx-auto max-w-lg px-5 py-16">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-accent">
            {isRegister ? "Join The Cozy Crochet" : "Welcome Back"}
          </p>
          <h1 className="mt-2 text-center font-display text-3xl sm:text-4xl font-medium">
            {isRegister ? "Create Your Account" : "Sign In to Your Corner"}
          </h1>
          <p className="mt-2 text-center text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {isRegister
              ? "Fill in your details below to create your account."
              : "Sign in with your email and password."}
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phone / WhatsApp <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button className="w-full py-6 font-bold text-sm shadow-sm gap-2" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Please wait...
                </>
              ) : isRegister ? (
                <>
                  Create Account <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-primary hover:underline cursor-pointer"
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
                  className="font-bold text-primary hover:underline cursor-pointer"
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
