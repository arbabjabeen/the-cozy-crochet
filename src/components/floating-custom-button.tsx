"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { CustomOrderModal } from "@/components/custom-order-modal";

export function FloatingCustomButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide floating button if already on the customize page
  if (pathname === "/custom-order") {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 animate-bounce-subtle">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-xl transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-2xl active:scale-95 cursor-pointer"
          aria-label="Customize a piece"
        >
          <Sparkles className="size-4 text-accent transition-transform group-hover:rotate-12" />
          <span>Customize Piece</span>
        </button>
      </div>

      <CustomOrderModal open={open} onOpenChange={setOpen} />
    </>
  );
}
