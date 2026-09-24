import { Link } from "@tanstack/react-router";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Search, Settings, ShoppingBag, Users, Menu, X, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const links = [
  ["Overview", "/admin", LayoutDashboard],
  ["Products", "/admin/products", Package],
  ["Orders", "/admin/orders", ClipboardList],
  ["Custom Orders", "/admin/custom-orders", Sparkles],
  ["Customers", "/admin/customers", Users],
  ["Inventory", "/admin/inventory", Boxes],
  ["Analytics", "/admin/analytics", BarChart3],
] as const;

export function AdminShell({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-dashboard text-foreground lg:grid lg:grid-cols-[240px_1fr]">
    <aside className={`${open ? "flex" : "hidden"} fixed inset-0 z-50 flex-col border-r border-border bg-card p-4 lg:sticky lg:top-0 lg:flex lg:h-screen`}>
      <div className="flex items-center justify-between px-2 py-3"><Link to="/" className="font-display text-xl font-medium">The Cozy Crochet</Link><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X/></Button></div>
      <div className="mt-4 rounded-lg bg-secondary p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Studio admin</p><p className="mt-1 text-sm font-semibold">AJ's workspace</p></div>
      <nav className="mt-5 flex flex-1 flex-col gap-1">{links.map(([label,to,Icon]) => <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }} activeOptions={{ exact: to === "/admin" }}><Icon className="size-4"/>{label}</Link>)}</nav>
      <div className="space-y-1 border-t border-border pt-3"><Button variant="ghost" className="w-full justify-start"><Settings/>Settings</Button><Button variant="ghost" className="w-full justify-start" asChild><Link to="/"><LogOut/>Back to shop</Link></Button></div>
    </aside>
    <main className="min-w-0">
      <header className="flex h-18 items-center gap-3 border-b border-border bg-card px-5 lg:px-8"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu/></Button><div className="relative hidden max-w-sm flex-1 sm:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Search…"/></div><div className="ml-auto flex items-center gap-2"><Button variant="outline" asChild><Link to="/"><ShoppingBag/>View store</Link></Button><div className="grid size-9 place-items-center rounded-full bg-accent font-bold text-accent-foreground">MC</div></div></header>
      <div className="p-5 lg:p-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Studio admin</p><h1 className="mt-2 font-display text-3xl font-medium">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{actions}</div>{children}</div>
    </main>
  </div>;
}

export function StatCard({ label, value, change, tone = "good" }: { label: string; value: string; change: string; tone?: "good" | "warn" }) {
  return <div className="rounded-lg border border-border bg-card p-5"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-medium">{value}</p><p className={`mt-2 text-xs font-bold ${tone === "good" ? "text-primary" : "text-accent"}`}>{change}</p></div>;
}

export function AdminTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground"><tr>{headers.map((h) => <th className="px-4 py-3 font-bold" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map((row,i) => <tr key={i} className="hover:bg-secondary/40">{row.map((cell,j) => <td key={j} className="px-4 py-4">{cell}</td>)}</tr>)}</tbody></table></div>;
}