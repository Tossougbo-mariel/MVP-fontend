"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useActiveAgencyId(): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const match = pathname.match(/^\/agences\/([^/]+)\//);
  return match ? match[1] : searchParams.get("agency");
}