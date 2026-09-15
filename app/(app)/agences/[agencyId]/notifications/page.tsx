"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgencyNotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/notifications");
  }, [router]);

  return (
    <div
      className="flex items-center justify-center min-h-[50vh] text-sm"
      style={{ color: "var(--text-secondary)" }}
    >
      Redirection vers vos notifications…
    </div>
  );
}