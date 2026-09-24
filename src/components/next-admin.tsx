"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Menu,
  X,
  Sparkles,
  MessageCircle,
  Bell,
  Store,
  ArrowRight,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const links = [
  ["Overview", "/admin", LayoutDashboard],
  ["Products", "/admin/products", Package],
  ["Orders", "/admin/orders", ClipboardList],
  ["Messages", "/admin/messages", MessageCircle],
  ["Customers", "/admin/customers", Users],
  ["Inventory", "/admin/inventory", Boxes],
  ["Analytics", "/admin/analytics", BarChart3],
] as const;



function AdminLoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("arbabjabeen2006@gmail.com");
  const [password, setPassword] = useState("aj1234qwerty");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email.trim(), password.trim());
      if (!res.success) {
        setError(res.message || "Invalid admin credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await login("arbabjabeen2006@gmail.com", "aj1234qwerty");
      if (!res.success) {
        // Fallback to demo admin
        await login("admin@cozycrochet.com", "adminpassword123");
      }
    } catch {
      setError("Could not complete quick login. Please type your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="size-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Lock className="size-7" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Studio Admin Portal
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              Sign In to Admin
            </h1>
            <p className="text-xs text-muted-foreground">
              Enter your credentials or tap 1-Click Quick Access below.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Admin Email
              </label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-5 font-bold text-sm shadow-md cursor-pointer"
            >
              {loading ? "Verifying..." : "Log In to Studio Admin"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleQuickLogin}
              className="w-full py-4 text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer"
            >
              <ShieldCheck className="mr-1.5 size-4" /> 1-Click Quick Access as AJ
            </Button>
          </form>

          <div className="pt-2 border-t border-border text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, initialized, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const [counts, setCounts] = useState<{
    orders: number;
    customOrders: number;
    messages: number;
  }>({ orders: 0, customOrders: 0, messages: 0 });

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [customList, setCustomList] = useState<any[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        let localOrders: any[] = [];
        let localCustom: any[] = [];
        let localMsgs: any[] = [];

        if (typeof window !== "undefined") {
          try {
            localOrders = JSON.parse(localStorage.getItem("cozy_studio_orders") || "[]");
            localCustom = JSON.parse(localStorage.getItem("cozy_studio_custom_orders") || "[]");
            localMsgs = JSON.parse(localStorage.getItem("cozy_studio_messages") || "[]");
          } catch {}
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const [ordersRes, customRes, msgRes, prodsRes] = await Promise.all([
          fetch("/api/orders", { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch("/api/custom-orders", { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch("/api/contact", { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch("/api/products", { signal: controller.signal }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        clearTimeout(timeoutId);

        const remoteO = Array.isArray(ordersRes) ? ordersRes : [];
        const remoteC = Array.isArray(customRes) ? customRes : [];
        const remoteM = Array.isArray(msgRes) ? msgRes : [];
        const pList = Array.isArray(prodsRes) ? prodsRes : [];

        // Deduplicate orders
        const oMap = new Map();
        [...localOrders, ...remoteO].forEach((o) => {
          const k = o.orderNumber || o.id || o._id;
          if (k && !oMap.has(k)) oMap.set(k, o);
        });
        const oList = Array.from(oMap.values());

        // Deduplicate custom orders
        const cMap = new Map();
        [...localCustom, ...remoteC].forEach((c) => {
          const k = c.customOrderId || c.id || c._id;
          if (k && !cMap.has(k)) cMap.set(k, c);
        });
        const cList = Array.from(cMap.values());

        // Deduplicate messages
        const mMap = new Map();
        [...localMsgs, ...remoteM].forEach((m) => {
          const k = m._id || m.id;
          if (k && !mMap.has(k)) mMap.set(k, m);
        });
        const mList = Array.from(mMap.values());

        setOrdersList(oList);
        setCustomList(cList);
        setMessagesList(mList);
        setProductsList(pList);

        setCounts({
          orders: oList.length,
          customOrders: cList.length,
          messages: mList.length,
        });

        const total = oList.length + cList.length + mList.length;
        if (total > 0 && typeof document !== "undefined") {
          document.title = `(${total}) The Cozy Crochet — Studio Admin`;
        }
      } catch {}
    };

    fetchCounts();
    const handleFocus = () => fetchCounts();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchCounts();
      }
    }, 25000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const totalNotifications = counts.orders + counts.customOrders + counts.messages;

  // Search filtering across orders, products, custom requests, and messages
  const q = searchQuery.toLowerCase().trim();
  const matchedOrders = q
    ? ordersList.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.phone?.includes(q) ||
          o.customer?.email?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedProducts = q
    ? productsList.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedCustom = q
    ? customList.filter(
        (c) =>
          c.customOrderId?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.productType?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedMessages = q
    ? messagesList.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.message?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const totalMatches =
    matchedOrders.length +
    matchedProducts.length +
    matchedCustom.length +
    matchedMessages.length;

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading Studio Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-dashboard text-foreground lg:grid lg:grid-cols-[240px_1fr]">
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card p-4 transition-transform duration-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <Link href="/" className="font-display text-xl font-medium">
            The Cozy Crochet
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4 rounded-xl bg-secondary p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Studio admin</p>
          <p className="mt-1 text-sm font-semibold">AJ's workspace</p>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1">
          {links.map(([label, href, Icon]) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

            let count = 0;
            if (label === "Orders") count = counts.orders + counts.customOrders;
            if (label === "Messages") count = counts.messages;

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors relative ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {/* Icon with notification badge on top */}
                <div className="relative">
                  <Icon className="size-4" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>

                <span className="flex-1">{label}</span>

                {/* Pill count badge on the right */}
                {count > 0 && (
                  <span
                    className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-xs ${
                      isActive
                        ? "bg-white text-primary"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border pt-3">
          <Button variant="ghost" className="w-full justify-start text-xs">
            <Settings className="size-4 mr-2" /> Settings
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0">
        <header className="flex h-18 items-center gap-3 border-b border-border bg-card px-5 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          {/* Global Admin Search Bar */}
          <div ref={searchRef} className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-8 text-xs h-9 bg-secondary/50 rounded-full border-border focus-visible:ring-1"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setSearchOpen(true);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}

            {/* Live Search Results Dropdown */}
            {searchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border bg-card shadow-2xl p-3 max-h-96 overflow-y-auto animate-in fade-in duration-150">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Search Results for "{searchQuery}"
                </p>

                {totalMatches === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No matching orders, products, or messages found.
                  </div>
                ) : (
                  <div className="space-y-3 mt-1">
                    {/* Orders */}
                    {matchedOrders.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase px-2">
                          Orders ({matchedOrders.length})
                        </span>
                        <div className="mt-1 space-y-1">
                          {matchedOrders.map((o) => (
                            <button
                              key={o._id || o.orderNumber}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                router.push("/admin/orders");
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-secondary flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <ClipboardList className="size-4 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="font-bold text-foreground">{o.orderNumber} · {o.customer?.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{o.customer?.phone || o.customer?.email}</p>
                                </div>
                              </div>
                              <span className="font-bold text-primary">${Number(o.total || 0).toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products */}
                    {matchedProducts.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-primary uppercase px-2">
                          Products ({matchedProducts.length})
                        </span>
                        <div className="mt-1 space-y-1">
                          {matchedProducts.map((p) => (
                            <button
                              key={p._id || p.slug}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                router.push("/admin/products");
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-secondary flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Package className="size-4 text-primary shrink-0" />
                                <div>
                                  <p className="font-bold text-foreground">{p.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{p.category}</p>
                                </div>
                              </div>
                              <span className="font-bold text-primary">${Number(p.price || 0).toFixed(2)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Orders */}
                    {matchedCustom.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase px-2">
                          Custom Requests ({matchedCustom.length})
                        </span>
                        <div className="mt-1 space-y-1">
                          {matchedCustom.map((c) => (
                            <button
                              key={c._id || c.customOrderId}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                router.push("/admin/orders");
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-secondary flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-amber-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-foreground">{c.customOrderId} · {c.customerName}</p>
                                  <p className="text-[11px] text-muted-foreground">{c.productType} · {c.colorPreference}</p>
                                </div>
                              </div>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary font-semibold">{c.status || "New"}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {matchedMessages.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase px-2">
                          Messages ({matchedMessages.length})
                        </span>
                        <div className="mt-1 space-y-1">
                          {matchedMessages.map((m, idx) => (
                            <button
                              key={m._id || idx}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                router.push("/admin/messages");
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-secondary flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <MessageCircle className="size-4 text-blue-500 shrink-0" />
                                <div className="truncate max-w-[280px]">
                                  <p className="font-bold text-foreground">{m.name} ({m.email})</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{m.message}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {/* Interactive Notification Bell Popover */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative grid size-9 place-items-center rounded-full border border-border hover:bg-secondary transition-colors cursor-pointer"
                title={`${totalNotifications} new notifications`}
              >
                <Bell className="size-4 text-foreground" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                    {totalNotifications > 9 ? "9+" : totalNotifications}
                  </span>
                )}
              </button>

              {/* Notification Menu Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 rounded-3xl border border-border bg-card shadow-2xl p-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h4 className="font-display text-sm font-bold text-foreground">Notifications & Activity</h4>
                      <p className="text-[11px] text-muted-foreground">{totalNotifications} total updates recorded</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Studio Live
                    </span>
                  </div>

                  {/* Notification Categories Grid */}
                  <div className="mt-3 space-y-2">
                    {/* Orders Notification */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push("/admin/orders");
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-border/70 hover:bg-secondary/70 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <ClipboardList className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Customer Orders</p>
                          <p className="text-[11px] text-muted-foreground">
                            {counts.orders > 0 ? `${counts.orders} orders placed` : "No orders placed yet"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {counts.orders}
                      </span>
                    </button>

                    {/* Custom Orders Notification */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push("/admin/orders");
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-border/70 hover:bg-secondary/70 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0">
                          <Sparkles className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Custom Orders</p>
                          <p className="text-[11px] text-muted-foreground">
                            {counts.customOrders > 0 ? `${counts.customOrders} custom requests` : "No custom requests yet"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {counts.customOrders}
                      </span>
                    </button>

                    {/* Messages Notification */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        router.push("/admin/messages");
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-border/70 hover:bg-secondary/70 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
                          <MessageCircle className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Customer Messages</p>
                          <p className="text-[11px] text-muted-foreground">
                            {counts.messages > 0 ? `${counts.messages} contact inquiries` : "No messages yet"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {counts.messages}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
            >
              <LogOut className="size-3.5 mr-1.5" /> Sign out
            </Button>
            <div className="grid size-9 place-items-center rounded-full bg-accent font-bold text-accent-foreground text-xs">
              AJ
            </div>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Studio admin</p>
              <h1 className="mt-2 font-display text-3xl font-medium">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  tone = "good",
}: {
  label: string;
  value: string;
  change: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1.5 sm:mt-2 font-display text-2xl sm:text-3xl font-medium">{value}</p>
      <p className={`mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-bold ${tone === "good" ? "text-primary" : "text-accent"}`}>
        {change}
      </p>
    </div>
  );
}

export function AdminTable({
  headers,
  rows,
  loading = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs -mx-1 sm:mx-0">
      <table className="w-full min-w-[620px] text-left text-xs sm:text-sm">
        <thead className="border-b border-border bg-secondary/60 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th className="px-3 sm:px-4 py-3 font-bold" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-16 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-medium animate-pulse">Loading...</span>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-muted-foreground">
                No records found
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-secondary/30 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-4">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
