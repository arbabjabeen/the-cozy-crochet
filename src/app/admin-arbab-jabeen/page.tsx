"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminArbabJabeenLoginPage() {
  const router = useRouter();
  const { user, login, logout, isAdmin, initialized } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // If already logged in as Admin, allow direct jump
  if (initialized && isAdmin && user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
            <div className="size-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <ShieldCheck className="size-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Master Admin Active
            </span>
            <h1 className="font-display text-2xl font-medium text-foreground">
              Welcome Back, AJ!
            </h1>
            <p className="text-xs text-muted-foreground">
              You are currently logged in as Master Studio Admin.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Button asChild size="lg" className="w-full font-bold shadow-md">
                <Link href="/admin">
                  Open Admin Panel <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full text-xs text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await login(email.trim(), password.trim());
      setLoading(false);

      if (res.success && res.user && res.user.role === "admin") {
        toast.success("Welcome back, AJ! Studio Admin unlocked.");
        router.push("/admin");
      } else {
        setErrorMessage(
          res.message || "Invalid admin credentials. Only Arbab Jabeen is authorized."
        );
      }
    } catch {
      setLoading(false);
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8">
      {/* Brand Icon */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
            🧶
          </span>
          <span className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
            The Cozy Crochet
          </span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="size-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Lock className="size-7" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Private Studio Portal
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              Admin Arbab Jabeen
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your master studio credentials to access the admin dashboard.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3.5 text-xs text-rose-800 dark:text-rose-200 text-center font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Admin Email Address <span className="text-primary">*</span>
              </label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 font-bold text-sm shadow-md cursor-pointer"
            >
              {loading ? "Verifying..." : "Log In to Admin Panel"}
            </Button>
          </form>

          <div className="pt-2 border-t border-border text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
