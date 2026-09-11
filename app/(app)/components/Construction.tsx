"use client";

import { motion, type Variants } from "framer-motion";
import { Construction as ConstructionIcon } from "lucide-react";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Construction({
  title = "Page en construction",
}: {
  title?: string;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center py-24 text-center gap-4"
    >
      <motion.div
        variants={item}
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "var(--gradient-button)",
          boxShadow: "0 4px 12px -4px rgba(37,99,235,0.35)",
        }}
      >
        <ConstructionIcon className="w-8 h-8 text-white" />
      </motion.div>
      <motion.h1
        variants={item}
        className="text-2xl font-black"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </motion.h1>
      <motion.p variants={item} style={{ color: "var(--text-secondary)" }}>
        Cette page sera bientôt disponible.
      </motion.p>
    </motion.div>
  );
}