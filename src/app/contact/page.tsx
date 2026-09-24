"use client";

import { useState } from "react";
import { MessageCircle, Sparkles, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoreShell } from "@/components/next-storefront";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");

  const isPhoneNumber = (val: string) => /^[\d\s+\-()]{6,}$/.test(val.trim());

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    let cleanName = name.trim();
    let cleanPhone = phone.trim();

    // If user accidentally entered phone number in the Name field and name in Phone field, swap them!
    if (isPhoneNumber(cleanName) && /[a-zA-Z]/.test(cleanPhone)) {
      const temp = cleanName;
      cleanName = cleanPhone;
      cleanPhone = temp;
    }

    if (!cleanName || !cleanPhone || !message.trim()) {
      toast.error("Please fill in your name, phone number, and message.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Never use a phone number as a display name
        const finalDisplayName = isPhoneNumber(cleanName) ? "" : cleanName;
        setSubmittedName(finalDisplayName);
        setSubmittedPhone(cleanPhone);
        setSent(true);

        // Persist to localStorage for real-time admin sync
        try {
          const existing = JSON.parse(localStorage.getItem("cozy_studio_messages") || "[]");
          const newMsg = {
            _id: `msg-${Date.now()}`,
            id: `msg-${Date.now()}`,
            name: cleanName,
            phone: cleanPhone,
            email: cleanPhone,
            message: message.trim(),
            createdAt: new Date().toISOString(),
            read: false,
          };
          const updated = [newMsg, ...existing];
          localStorage.setItem("cozy_studio_messages", JSON.stringify(updated.slice(0, 50)));
        } catch {}

        setName("");
        setPhone("");
        setMessage("");
      } else {
        toast.error(data.message || "Failed to send message. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreShell>
      <div className="mx-auto max-w-lg px-5 py-12 sm:py-16">
        <div className="rounded-3xl border border-border bg-card p-7 sm:p-9 shadow-sm">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-6" />
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight">Contact AJ</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Send a direct message to AJ
            </p>
          </div>

          {sent ? (
            <div className="py-6 text-center space-y-5">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart className="size-7 text-primary fill-primary/20" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-medium text-foreground">
                  {submittedName ? `Thank You, ${submittedName}! 🌸` : "Thank You! 🌸"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your message has been delivered to AJ!
                </p>
              </div>

              {/* Automatic warm response from AJ */}
              <div className="rounded-2xl bg-primary/5 p-5 text-sm text-foreground leading-relaxed border border-primary/20 text-left space-y-2">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="size-4" /> Message from AJ:
                </p>
                <p className="text-muted-foreground italic">
                  {submittedName
                    ? `"Hello ${submittedName}! Thank you so much for reaching out to The Cozy Crochet. I have received your message and will reach out to you on WhatsApp shortly with love and care. Have a wonderful day! ✨"`
                    : `"Hello! Thank you so much for reaching out to The Cozy Crochet. I have received your message and will reach out to you on WhatsApp shortly with love and care. Have a wonderful day! ✨"`}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card text-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => setSent(false)}
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Name <span className="text-primary">*</span>
                </label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone / WhatsApp <span className="text-primary">*</span>
                </label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Message <span className="text-primary">*</span>
                </label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-xl resize-none"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl mt-2"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="size-4 mr-2" /> Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </StoreShell>
  );
}
