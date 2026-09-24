"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Trash2, RefreshCw, Phone, Clock, Sparkles } from "lucide-react";
import { AdminShell, AdminTable } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Message deleted");
        setMessages((prev) => prev.filter((m) => m._id !== id));
      }
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const getCleanPhone = (phoneStr: string) => {
    if (!phoneStr) return "";
    let clean = phoneStr.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "92" + clean.slice(1);
    } else if (clean.startsWith("3")) {
      clean = "92" + clean;
    }
    return clean;
  };

  return (
    <AdminShell
      title="Messages"
      description="Direct inquiries sent by customers from your website contact form."
      actions={
        <Button variant="outline" size="sm" onClick={loadMessages}>
          <RefreshCw className="mr-1.5 size-4" /> Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <MessageCircle className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-medium">No Messages Yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When visitors submit the contact form on your website, their messages and contact numbers will appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {messages.map((m) => {
              const cleanPhone = getCleanPhone(m.phone || m.email);
              const waLink = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${m.name}! 🌸 This is AJ from The Cozy Crochet. Thank you for your message: "${m.message}"`
                  )}`
                : null;

              return (
                <div
                  key={m._id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-foreground">{m.name}</h3>
                        <p className="flex items-center gap-1 text-xs text-primary font-semibold mt-0.5">
                          <Phone className="size-3" /> {m.phone || m.email || "No phone provided"}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "Recent"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-background/60 p-3.5 text-sm text-foreground/90 border border-border/60 leading-relaxed whitespace-pre-wrap">
                      {m.message}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-xs"
                      >
                        <MessageCircle className="size-3.5" /> Reply on WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No WhatsApp number</span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(m._id)}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
