"use client";

import { Mail, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminShell, AdminTable } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { fetchOrders, fetchCustomOrders } from "@/lib/api";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [orders, customOrders, subsRes] = await Promise.all([
        fetchOrders(),
        fetchCustomOrders(),
        fetch("/api/newsletter").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      setSubscribers(subsRes || []);

      const customerMap = new Map<string, any>();

      // From standard store orders
      orders.forEach((o: any) => {
        const email = o.customer?.email || "customer@example.com";
        const name = o.customer?.name || "Shopper";
        const phone = o.customer?.phone || "N/A";
        const total = o.total || 0;

        if (customerMap.has(email)) {
          const existing = customerMap.get(email);
          existing.orders += 1;
          existing.spent += total;
        } else {
          customerMap.set(email, {
            name,
            email,
            phone,
            orders: 1,
            spent: total,
            lastOrder: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Recent",
            type: "Standard Order",
          });
        }
      });

      // From custom orders
      customOrders.forEach((co: any) => {
        const email = co.customerEmail;
        const name = co.customerName;
        const phone = co.customerPhone;

        if (customerMap.has(email)) {
          const existing = customerMap.get(email);
          existing.orders += 1;
          existing.type = "Standard & Custom";
        } else {
          customerMap.set(email, {
            name,
            email,
            phone,
            orders: 1,
            spent: 0,
            lastOrder: co.createdAt ? new Date(co.createdAt).toLocaleDateString() : "Recent",
            type: "Custom Order",
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch {
      toast.error("Could not load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  const handleClearDemoData = async () => {
    if (!confirm("Are you sure you want to clear sample demo customers? Only real incoming orders will be kept.")) return;
    try {
      const res = await fetch("/api/admin/clear-demo", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadCustomerData();
      }
    } catch {
      toast.error("Failed to clear demo data");
    }
  };

  return (
    <AdminShell
      title="Customers"
      description="The real people who order and commission your handmade crochet pieces."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearDemoData}>
            <Trash2 className="mr-1.5 size-4 text-destructive" /> Clear Demo Customers
          </Button>
          <Button variant="outline" size="sm" onClick={loadCustomerData}>
            <RefreshCw className="mr-1.5 size-4" /> Refresh
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-lg font-medium">No Customer Orders Yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When visitors submit custom orders or purchase items, their contact info and order history will automatically appear here!
          </p>
        </div>
      ) : (
        <AdminTable
          headers={["Customer", "Email", "Phone", "Orders", "Type", "Last Activity"]}
          rows={customers.map((c) => [
            <div className="flex items-center gap-3" key={c.email}>
              <span className="grid size-9 place-items-center rounded-full bg-secondary font-bold text-primary text-xs">
                {c.name
                  .split(" ")
                  .map((x: string) => x.charAt(0))
                  .join("")}
              </span>
              <div>
                <strong className="block text-foreground">{c.name}</strong>
              </div>
            </div>,
            c.email,
            c.phone || "N/A",
            `${c.orders} order(s)`,
            <span
              key={`type-${c.email}`}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              {c.type}
            </span>,
            c.lastOrder,
          ])}
        />
      )}

      {/* Newsletter Subscribers Section */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-display text-lg font-medium">Newsletter & Studio Notes Subscribers</h3>
            <p className="text-xs text-muted-foreground">
              Visitors who signed up in the footer to receive crochet updates and offers.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {subscribers.length} Subscribers
          </span>
        </div>

        {subscribers.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No subscribers yet. When visitors sign up in the footer, they will appear here.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {subscribers.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-foreground">{s.email}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {s.date ? new Date(s.date).toLocaleDateString() : "Recent"}
                  </span>
                  <Button
                    size="sm"
                    variant="soft"
                    className="text-xs h-7"
                    onClick={() => {
                      navigator.clipboard.writeText(s.email);
                      toast.success(`Copied ${s.email} to clipboard!`);
                    }}
                  >
                    Copy Email
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
