"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { FileQuestion, Home } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("Errors");
  const tc = useTranslations("Common");

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
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        <FileQuestion className="w-8 h-8" />
      </motion.div>

      <div>
        <h1
          className="text-3xl font-black"
          style={{
            backgroundImage: "linear-gradient(135deg, var(--blue), var(--blue-light))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {t("notFoundTitle")}
        </h1>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
          {t("notFoundDescription")}
        </p>
      </div>

      <Link
        href="/mes-agences"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--gradient-button)", boxShadow: "0 10px 24px -8px rgba(var(--blue-rgb),0.5)" }}
      >
        <Home size={16} /> {tc("backToMyAgencies")}
      </Link>
    </motion.div>
  );
}
