"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  X,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function CheckoutAuthModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"signin" | "register">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (tab === "signin") {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message || "Invalid email or password");
      }
    } else {
      const res = await register({
        name,
        email,
        password,
        phone,
        role: "buyer",
      });
      setLoading(false);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message || "Registration failed");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
            <ShoppingBag className="size-6" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground">
            {tab === "signin" ? "Sign In to Complete Order" : "Quick Buyer Registration"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {tab === "signin"
              ? "Sign in to save your delivery address and receive WhatsApp updates."
              : "Create an account in 30 seconds to track your handcrafted order."}
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 mb-5 border border-border/80">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setErrorMsg("");
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === "signin"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMsg("");
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === "register"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
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
                  Phone / WhatsApp <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    required
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 font-bold text-sm shadow-sm gap-2 mt-2"
          >
            {loading ? (
              "Please wait..."
            ) : tab === "signin" ? (
              <>
                Sign In & Continue Order <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                Create Account & Continue <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        {/* Benefits footer */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" /> Free Gift Wrap
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" /> Direct WhatsApp Assistance
          </span>
        </div>
      </div>
    </div>
  );
}
