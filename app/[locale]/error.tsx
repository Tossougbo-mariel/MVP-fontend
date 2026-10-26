"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("Errors");
  const tc = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "color-mix(in srgb, var(--color-error) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-error) 30%, transparent)",
          color: "var(--color-error)",
        }}
      >
        <AlertTriangle className="w-8 h-8" />
      </motion.div>

      <div>
        <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          {t("errorTitle")}
        </h1>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
          {t("errorDescription")}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-button)" }}
        >
          <RotateCcw size={16} /> {tc("retry")}
        </button>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <Home size={16} /> {tc("backToMyAgencies")}
        </Link>
      </div>
    </motion.div>
  );
}
