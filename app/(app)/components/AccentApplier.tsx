"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent } from "@/lib/applyAccent";

export default function AccentApplier() {
  const themeColor = useAuthStore((s) => s.user?.themeColor);

  useEffect(() => {
    applyAccent(themeColor);
  }, [themeColor]);

  useEffect(() => () => applyAccent(null), []);

  return null;
}