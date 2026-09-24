import type { Metadata } from "next";
import "@/styles.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "The Cozy Crochet — Handmade Crochet Goods",
  description: "Handmade crochet goods, stitched slowly and wrapped with care. Custom bespoke crochet orders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Karla:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-body text-foreground antialiased selection:bg-accent/20">
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster richColors position="top-right" duration={1800} closeButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
