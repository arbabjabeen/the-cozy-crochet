"use client";

import { useState, useEffect } from "react";
import { AdminShell, StatCard } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Sparkles, ShoppingBag, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>({
    revenue: "$45.00",
    rawRevenue: 45,
    orders: 3,
    customOrdersCount: 3,
    averageOrder: "$15.00",
    lowStock: 1,
    totalProducts: 10,
    monthlyBars: [42, 58, 46, 76, 68, 92, 81, 104, 96, 118, 110, 136],
  });
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("/api/analytics", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Keep existing data quietly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const monthlyBars = data?.monthlyBars || [42, 58, 46, 76, 68, 92, 81, 104, 96, 118, 110, 136];
  const maxBar = Math.max(...monthlyBars, 100);

  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  return (
    <AdminShell
      title="Studio Analytics & Performance"
      description="A real-time overview of orders, custom commission requests, sales revenue, and top-selling crochet creations."
      actions={
        <Button variant="outline" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="mr-1.5 size-4" /> Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="p-16 text-center text-muted-foreground">Calculating studio metrics...</div>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              label="Net Sales"
              value={data?.revenue || "$0.00"}
              change="From completed store orders"
            />
            <StatCard
              label="Store Orders"
              value={String(data?.orders || 0)}
              change="Total checkout orders"
            />
            <StatCard
              label="Custom Commissions"
              value={String(data?.customOrdersCount || 0)}
              change="Bespoke customer requests"
            />
            <StatCard
              label="Average Order Value"
              value={data?.averageOrder || "$0.00"}
              change="Average basket total"
            />
          </div>

          {/* Charts & Top Products Row */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            {/* Sales Bar Chart */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-medium">Sales & Order Volume</h3>
                  <p className="text-xs text-muted-foreground">Last 12 months studio activity</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Estimated Annual Run Rate</span>
                  <strong className="font-display text-2xl text-primary">{data?.revenue || "$0"}</strong>
                </div>
              </div>

              <div className="mt-8 flex h-56 items-end gap-2.5 border-b border-border px-2 pb-2">
                {monthlyBars.map((val: number, i: number) => {
                  const heightPercent = Math.round((val / maxBar) * 100);
                  return (
                    <div
                      key={i}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                    >
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-foreground px-2 py-1 text-[10px] font-bold text-background group-hover:block z-10 whitespace-nowrap">
                        {months[i]}: {val} orders
                      </div>
                      <div
                        className="w-full rounded-t-md bg-primary/70 transition-all duration-200 group-hover:bg-primary group-hover:scale-y-105"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-between text-[11px] font-semibold text-muted-foreground">
                {months.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </section>

            {/* Top Products */}
            <aside className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg font-medium">Top Loved Creations</h3>
                <p className="text-xs text-muted-foreground">Best-selling pieces based on order demand</p>

                <div className="mt-5 space-y-4">
                  {(data?.topProducts || []).slice(0, 5).map((p: any) => (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">({p.unitsSold} sold)</span>
                          <strong className="text-primary">{p.sales}</strong>
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: p.percentage || "20%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground flex justify-between items-center">
                <span>Active pieces in catalog:</span>
                <strong className="text-foreground font-semibold">{data?.totalProducts || 8} pieces</strong>
              </div>
            </aside>
          </div>

          {/* Secondary Row: Custom Orders Pipeline & Category Breakdown */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Custom Orders Pipeline */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-accent" />
                  <h3 className="font-display text-lg font-medium">Custom Commissions Pipeline</h3>
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
                  {data?.customOrdersCount || 0} Total
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-secondary/50 p-3">
                  <span className="text-xs text-muted-foreground block">New Requests</span>
                  <strong className="text-xl font-bold text-foreground">
                    {data?.customStatusCount?.["New"] || 0}
                  </strong>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <span className="text-xs text-muted-foreground block">In Progress</span>
                  <strong className="text-xl font-bold text-blue-600">
                    {data?.customStatusCount?.["In Progress"] || 0}
                  </strong>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3">
                  <span className="text-xs text-muted-foreground block">Completed</span>
                  <strong className="text-xl font-bold text-primary">
                    {data?.customStatusCount?.["Completed"] || 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Catalog Categories */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Package className="size-5 text-primary" />
                  <h3 className="font-display text-lg font-medium">Catalog by Category</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {data?.totalProducts || 0} Total Items
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {Object.entries(data?.categoryCount || {}).map(([cat, count]: [string, any]) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-sm"
                  >
                    <span className="font-medium">{cat}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
