"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Store,
  Package,
  ClipboardList,
  LogOut,
  Sparkles,
  Menu,
  X,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function VendorShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isVendor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not logged in or not vendor
  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Store className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Vendor Portal Access</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This area is dedicated to verified crochet artisans and sellers. Please sign in or register with a vendor account to continue.
          </p>
          <div className="mt-6 space-y-2">
            <Button asChild className="w-full">
              <Link href="/account">Sign In / Register as Vendor</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Return to Storefront</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = user.status === "approved";

  const navLinks = [
    { label: "Overview", href: "/vendor", icon: Store },
    { label: "My Products", href: "/vendor/products", icon: Package, disabled: !isApproved },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/vendor" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                🧶
              </span>
              <div>
                <span className="font-display text-base font-bold tracking-tight text-foreground block">
                  The Cozy Crochet
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent block -mt-0.5">
                  Vendor Artisan Studio
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return item.disabled ? (
                <span
                  key={item.href}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed"
                  title="Requires Admin Approval"
                >
                  <Icon className="size-4" />
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile & status */}
          <div className="flex items-center gap-3">
            {/* Status pill */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
              }`}
            >
              {isApproved ? (
                <>
                  <CheckCircle2 className="size-3" /> Approved Seller
                </>
              ) : (
                <>
                  <Clock className="size-3" /> Approval Pending
                </>
              )}
            </span>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground leading-tight">
                {user.shopName || user.name}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {user.email}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.push("/account");
              }}
              className="text-xs"
            >
              <LogOut className="size-3.5 mr-1" /> Sign out
            </Button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground hover:bg-secondary"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border px-5 py-4 bg-card space-y-2">
            <div className="pb-2 border-b border-border/60">
              <p className="text-xs font-bold text-foreground">{user.shopName || user.name}</p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
                }`}
              >
                {isApproved ? "Approved Seller" : "Approval Pending"}
              </span>
            </div>

            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return item.disabled ? null : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page Header */}
      <div className="bg-secondary/40 border-b border-border/60 py-8 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-5 py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
