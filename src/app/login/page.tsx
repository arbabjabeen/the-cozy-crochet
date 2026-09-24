"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type UserRole } from "@/context/AuthContext";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";

  const { login, register, user, isAdmin, logout } = useAuth();

  const [mode, setMode] = useState<"signin" | "register">("signin");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (mode === "signin") {
      const res = await login(email, password);
      setLoading(false);

      if (res.success && res.user) {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (res.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      } else {
        setErrorMessage(res.message || "Invalid email or password");
      }
    } else {
      const res = await register({
        name,
        email,
        password,
        phone,
      });

      setLoading(false);

      if (res.success && res.user) {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (res.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/shop");
        }
      } else {
        setErrorMessage(res.message || "Registration failed");
      }
    }
  };

  // If already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
              🧶
            </span>
            <span className="font-display text-3xl font-medium tracking-tight text-foreground">
              The Cozy Crochet
            </span>
          </Link>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div className="size-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="size-7" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Already Signed In
            </h2>
            <p className="text-xs text-muted-foreground">
              {user.name} ({user.email})
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Button asChild className="w-full py-5 font-bold text-xs" size="sm">
                <Link href="/shop">
                  Continue to Shop <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full py-5 text-xs text-rose-600 hover:bg-rose-50"
                onClick={logout}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            🧶
          </span>
          <span className="font-display text-3xl font-medium tracking-tight text-foreground">
            The Cozy Crochet
          </span>
        </Link>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Handcrafted Heirloom Crochet Studio
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Tabs: Sign In / Create Account */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 mb-6 border border-border/80">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs text-rose-800 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration Extra Fields */}
            {mode === "register" && (
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

            {/* Email field */}
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

            {/* Password field */}
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

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 font-bold text-sm shadow-sm gap-2"
            >
              {loading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Please wait...
                </>
              ) : mode === "signin" ? (
                <>
                  Sign In <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Back to store link */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
