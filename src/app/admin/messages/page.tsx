"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Trash2, RefreshCw, Phone, Clock } from "lucide-react";
import { AdminShell } from "@/components/next-admin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DELETED_KEY = "cozy_deleted_message_ids";
const DELETED_SIGS_KEY = "cozy_deleted_message_sigs";

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add("msg-demo-1");
    set.add("msg-demo-2");
    set.add("msg-1790263780063");
    return set;
  } catch {
    return new Set<string>(["msg-demo-1", "msg-demo-2", "msg-1790263780063"]);
  }
}

function addDeletedId(id: string) {
  try {
    const ids = getDeletedIds();
    ids.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function getDeletedSignatures(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SIGS_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add("powder blue color");
    set.add("strawberry keychain");
    return set;
  } catch {
    return new Set<string>(["powder blue color", "strawberry keychain"]);
  }
}

function addDeletedSignature(sig: string) {
  try {
    const sigs = getDeletedSignatures();
    sigs.add(sig);
    localStorage.setItem(DELETED_SIGS_KEY, JSON.stringify(Array.from(sigs)));
  } catch {}
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      // Always read deleted blacklist first
      const deletedIds = getDeletedIds();
      const deletedSigs = getDeletedSignatures();

      let localMsgs: any[] = [];
      try {
        localMsgs = JSON.parse(localStorage.getItem("cozy_studio_messages") || "[]");
      } catch {}

      // Fetch from server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      let remoteMsgs: any[] = [];
      let serverOk = false;
      try {
        const res = await fetch("/api/contact", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          serverOk = true;
          const data = await res.json();
          if (Array.isArray(data)) remoteMsgs = data;
        }
      } catch {
        clearTimeout(timeoutId);
      }

      // If server responded successfully, sync localStorage to prevent stale ghosts
      if (serverOk) {
        try {
          const sanitizedRemote = remoteMsgs.filter((m) => {
            const key = m._id || m.id;
            if (!key || deletedIds.has(key)) return false;
            if (key.startsWith("msg-demo") || key === "msg-1790263780063") return false;
            for (const sig of deletedSigs) {
              if (m.message && m.message.includes(sig)) return false;
            }
            return true;
          });
          localStorage.setItem("cozy_studio_messages", JSON.stringify(sanitizedRemote));
        } catch {}
      }

      // Merge + deduplicate + filter deleted + purge demo messages
      const merged = serverOk ? remoteMsgs : [...localMsgs, ...remoteMsgs];
      const seen = new Set<string>();
      const unique = merged.filter((m) => {
        const key = m._id || m.id;
        if (!key || seen.has(key) || deletedIds.has(key)) return false;
        if (
          key.startsWith("msg-demo") ||
          key === "msg-1790263780063" ||
          (m.id && (m.id.startsWith("msg-demo") || m.id === "msg-1790263780063")) ||
          (m._id && (m._id.startsWith("msg-demo") || m._id === "msg-1790263780063"))
        ) {
          return false;
        }
        for (const sig of deletedSigs) {
          if (m.message && m.message.includes(sig)) return false;
        }
        seen.add(key);
        return true;
      });

      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(unique);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const handleFocus = () => loadMessages();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("cozy_messages_updated", loadMessages);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadMessages();
      }
    }, 20000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("cozy_messages_updated", loadMessages);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const target = messages.find(
      (m) => (m._id || m.id) === id || m.id === id || m._id === id
    );

    // 1. Add to permanent blacklist immediately
    addDeletedId(id);
    if (target?._id) addDeletedId(target._id);
    if (target?.id) addDeletedId(target.id);
    if (target?.message) {
      addDeletedSignature(target.message.trim());
      addDeletedSignature(`${target.name || ""}::${target.message.trim()}`);
    }

    // 2. Instant optimistic removal from UI
    setMessages((prev) =>
      prev.filter((m) => {
        const mId = m._id || m.id;
        if (mId === id || m.id === id || m._id === id) return false;
        if (target && target.message && m.message === target.message && m.name === target.name) return false;
        return true;
      })
    );

    // 3. Remove from localStorage messages cache
    try {
      const local = JSON.parse(localStorage.getItem("cozy_studio_messages") || "[]");
      const updated = local.filter((m: any) => {
        const mId = m._id || m.id;
        if (mId === id || m.id === id || m._id === id) return false;
        if (target && target.message && m.message === target.message && m.name === target.name) return false;
        return true;
      });
      localStorage.setItem("cozy_studio_messages", JSON.stringify(updated));
    } catch {}

    // 4. Notify sidebar badge to update instantly
    try {
      window.dispatchEvent(
        new CustomEvent("cozy_messages_updated", {
          detail: { id, targetName: target?.name, targetMessage: target?.message },
        })
      );
    } catch {}

    // 5. Fire API delete in background
    fetch(`/api/contact?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

    toast.success("Message deleted successfully");
  };

  const handleClearAll = async () => {
    // Blacklist all current messages
    messages.forEach((m) => {
      const msgId = m._id || m.id;
      if (msgId) addDeletedId(msgId);
      if (m.message) addDeletedSignature(m.message.trim());
    });

    // Instant optimistic state clearing
    setMessages([]);

    try {
      localStorage.setItem("cozy_studio_messages", "[]");
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent("cozy_messages_updated", { detail: { clearAll: true } }));
    } catch {}

    fetch("/api/contact", { method: "DELETE" }).catch(() => {});
    toast.success("All messages cleared successfully");
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
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <Trash2 className="mr-1.5 size-4 text-destructive" /> Clear All Messages
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadMessages(); }}>
            <RefreshCw className="mr-1.5 size-4" /> Refresh
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
          <div className="size-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-sm font-medium tracking-wide text-muted-foreground animate-pulse">Loading messages...</p>
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
              const msgId = m._id || m.id;
              const cleanPhone = getCleanPhone(m.phone || m.email);
              const waLink = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${m.name}! 🌸 This is AJ from The Cozy Crochet. Thank you for your message: "${m.message}"`
                  )}`
                : null;

              return (
                <div
                  key={msgId}
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
                      onClick={() => handleDelete(msgId)}
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
