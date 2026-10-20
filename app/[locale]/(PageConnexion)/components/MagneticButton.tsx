"use client";
import { useRef } from "react";
import { motion, useSpring } from "framer-motion";

export default function MagneticButton({
  children,
  className,
  style,
  type,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  type?: "submit" | "button" | "reset";
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Translation aimantée gérée par framer-motion (ressort doux)
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  return (
    <motion.button
      ref={ref}
      type={type ?? "button"}
      style={{ x, y, ...style }}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
      onMouseMove={(e) => {
        if (disabled) return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        x.set(relX * 0.25);
        y.set(relY * 0.25);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={`glow-hover ${className ?? ""}`}
    >
      {children}
    </motion.button>
  );
}