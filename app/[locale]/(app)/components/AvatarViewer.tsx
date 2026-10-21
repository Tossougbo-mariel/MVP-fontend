"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crop } from "lucide-react";

interface AvatarViewerProps {
  open: boolean;
  src: string | null | undefined;
  alt?: string;
  onClose: () => void;
  onCrop?: () => void;
}

export default function AvatarViewer({
  open,
  src,
  alt = "Photo de profil",
  onClose,
  onCrop,
}: AvatarViewerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(1, 11, 37, 0.88)", backdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Fond assombri avec la même photo en très large (blur) */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px)",
            }}
          />

          <motion.div
            className="relative max-w-[80vw] max-h-[80vh] rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--chrome-border)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)" }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-w-[78vw] max-h-[75vh] w-auto h-auto object-contain rounded-2xl"
            />

            {onCrop && (
              <button
                onClick={onCrop}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 24px -6px rgba(0,0,0,0.6)" }}
              >
                <Crop className="w-4 h-4" /> Recadrer cette photo
              </button>
            )}
          </motion.div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 hover:rotate-90"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}