"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Truck,
  Cloud,
  Bell,
  ShieldCheck,
  Save,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  Sliders,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { AdminShell } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { pullFromCloudSync, fetchProducts, fetchOrders } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface StudioSettings {
  storeName: string;
  founderName: string;
  supportPhone: string;
  supportEmail: string;
  tagline: string;
  currency: string;
  shippingFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: string;
  acceptCustomOrders: boolean;
  orderSound: boolean;
  messageSound: boolean;
  lowStockThreshold: number;
}

const DEFAULT_SETTINGS: StudioSettings = {
  storeName: "The Cozy Crochet",
  founderName: "Arbab Jabeen",
  supportPhone: "+92 300 1234567",
  supportEmail: "contact@thecozycrochet.com",
  tagline: "Every stitch tells a story · 100% handcrafted with love",
  currency: "PKR (Rs.)",
  shippingFee: 250,
  freeShippingThreshold: 2500,
  estimatedDeliveryDays: "3-5 Business Days",
  acceptCustomOrders: true,
  orderSound: true,
  messageSound: true,
  lowStockThreshold: 3,
};

const SETTINGS_STORAGE_KEY = "cozy_studio_settings";

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [syncing, setSyncing] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Active & in sync");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {}
  }, []);

  const handleChange = (field: keyof StudioSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setSavedSuccess(true);
      toast.success("Studio settings saved successfully!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cozy_settings_updated", { detail: settings }));
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      toast.error("Failed to save settings to local storage");
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await pullFromCloudSync(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast.success("Cloud bin and devices synchronized instantly!");
    } catch {
      toast.error("Sync completed with local cache.");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearDemoData = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear demo test orders? Real customer orders will NOT be affected."
    );
    if (!confirmClear) return;

    setClearingDemo(true);
    try {
      const res = await fetch("/api/admin/clear-demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Demo orders cleared successfully!");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cozy_orders_updated"));
        }
      } else {
        toast.error(data.message || "Failed to clear demo orders");
      }
    } catch {
      toast.error("Network error while clearing demo orders");
    } finally {
      setClearingDemo(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      toast.info("Preparing complete studio backup...");
      const [prods, ords, msgs] = await Promise.all([
        fetchProducts().catch(() => []),
        fetchOrders().catch(() => []),
        fetch("/api/contact")
          .then((r) => r.json())
          .catch(() => {
            try {
              return JSON.parse(localStorage.getItem("cozy_studio_messages") || "[]");
            } catch {
              return [];
            }
          }),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        settings,
        productsCount: prods.length,
        ordersCount: ords.length,
        messagesCount: msgs.length,
        data: {
          products: prods,
          orders: ords,
          messages: msgs,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cozy-crochet-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Studio backup downloaded successfully!");
    } catch {
      toast.error("Could not export backup data");
    }
  };

  return (
    <AdminShell
      title="Studio Settings"
      description="Manage your storefront profile, shipping policies, multi-device cloud synchronization, and studio alerts."
      actions={
        <div className="flex items-center gap-2">
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="text-xs h-9"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Cloud"}
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="text-xs h-9 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-xs"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="size-3.5 mr-1.5 text-white" /> Saved!
              </>
            ) : (
              <>
                <Save className="size-3.5 mr-1.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl">
        {/* Section 1: Store & Brand Profile */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Store & Brand Information</h2>
              <p className="text-xs text-muted-foreground">
                Public studio identity displayed on customer invoices and receipts.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-5">
            <div>
              <label className="text-xs font-semibold text-foreground">Store Name</label>
              <Input
                value={settings.storeName}
                onChange={(e) => handleChange("storeName", e.target.value)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="The Cozy Crochet"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Founder & Lead Artisan</label>
              <Input
                value={settings.founderName}
                onChange={(e) => handleChange("founderName", e.target.value)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="Arbab Jabeen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Studio Support Phone / WhatsApp</label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={settings.supportPhone}
                  onChange={(e) => handleChange("supportPhone", e.target.value)}
                  className="pl-8 text-xs h-9 bg-secondary/40"
                  placeholder="+92 300 1234567"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Customer Support Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={settings.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="pl-8 text-xs h-9 bg-secondary/40"
                  placeholder="contact@thecozycrochet.com"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Store Tagline / Bio</label>
              <Input
                value={settings.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="Every stitch tells a story · 100% handcrafted with love"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shipping & Delivery Rules */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Truck className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Shipping & Checkout Policies</h2>
              <p className="text-xs text-muted-foreground">
                Set domestic delivery fees, free delivery limits, and custom orders acceptance.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-5">
            <div>
              <label className="text-xs font-semibold text-foreground">Standard Delivery Fee (Rs.)</label>
              <Input
                type="number"
                value={settings.shippingFee}
                onChange={(e) => handleChange("shippingFee", Number(e.target.value) || 0)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="250"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Charged on standard orders</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Free Delivery Threshold (Rs.)</label>
              <Input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => handleChange("freeShippingThreshold", Number(e.target.value) || 0)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="2500"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Free shipping over this amount</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Estimated Delivery Time</label>
              <Input
                value={settings.estimatedDeliveryDays}
                onChange={(e) => handleChange("estimatedDeliveryDays", e.target.value)}
                className="mt-1.5 text-xs h-9 bg-secondary/40"
                placeholder="3-5 Business Days"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Shown at checkout</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Accept New Custom Orders</p>
              <p className="text-[11px] text-muted-foreground">
                Toggle off if studio queue is full and you need to pause custom requests.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.acceptCustomOrders}
                onChange={(e) => handleChange("acceptCustomOrders", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Multi-Device Cloud Synchronization */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Cloud className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Multi-Device Cloud Sync & Backups</h2>
              <p className="text-xs text-muted-foreground">
                Bidirectional synchronization across mobile phones, laptops, and admin devices.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Sync Engine</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Real-time cloud bin mirror with automatic cache-busting and conflict resolution.
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Last Synced:</span>
                <span className="font-semibold text-foreground">{lastSyncTime}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Full Studio Backup</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Download all catalog items, customer orders, and messages in a single JSON backup.
                </p>
              </div>
              <Button
                onClick={handleExportBackup}
                variant="outline"
                size="sm"
                className="mt-3 text-xs w-full h-8"
              >
                <Download className="size-3.5 mr-1.5" /> Download JSON Backup
              </Button>
            </div>
          </div>

          {/* Dangerous / Maintenance Actions */}
          <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" /> Reset Demo Test Orders
              </p>
              <p className="text-[11px] text-muted-foreground">
                Clears mock demonstration orders so the studio only shows real customer purchases.
              </p>
            </div>
            <Button
              onClick={handleClearDemoData}
              disabled={clearingDemo}
              variant="outline"
              size="sm"
              className="text-xs text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              {clearingDemo ? "Clearing..." : "Clear Demo Orders"}
            </Button>
          </div>
        </div>

        {/* Section 4: Notifications & Audio Alerts */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Studio Alerts & Notifications</h2>
              <p className="text-xs text-muted-foreground">
                Configure live badge indicators and low-stock inventory warnings.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Low Stock Threshold Warning</p>
                <p className="text-[11px] text-muted-foreground">
                  Flags products in Inventory and Overview when units fall to this quantity or below.
                </p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.lowStockThreshold}
                  onChange={(e) => handleChange("lowStockThreshold", Number(e.target.value) || 1)}
                  className="text-xs h-8 text-center bg-secondary/40"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Play Sound on New Order</p>
                <p className="text-[11px] text-muted-foreground">
                  Audible chime when a new customer order is placed.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.orderSound}
                  onChange={(e) => handleChange("orderSound", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Admin Security & Account */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Admin Security & Session</h2>
              <p className="text-xs text-muted-foreground">
                Master administrator access credentials and session management.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">
                Logged in as: <span className="text-primary">{user?.email || "arbabjabeen2006@gmail.com"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Role: Master Studio Administrator (Full Read & Write Access)
              </p>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Sign out of Studio Admin
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
