"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function TokenPage() {
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
            backgroundImage: "linear-gradient(135deg, #8B5CF6, #3B82F6 55%, #101725)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Page introuvable
        </h1>
        <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
          Cette adresse ne correspond à rien. Elle a peut-être changé, ou le lien que vous
          avez utilisé est invalide.
        </p>
      </div>

      <Link
        href="/mes-agences"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
        style={{ background: "var(--gradient-button)", boxShadow: "0 10px 24px -8px rgba(5,108,242,0.5)" }}
      >
        <Home size={16} /> Retour à mes agences
      </Link>
    </motion.div>
  );
}