"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminArbabJabeenSlashRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-arbab-jabeen");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
