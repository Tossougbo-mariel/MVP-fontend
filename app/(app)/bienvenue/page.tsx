"use client";

// Page d'accueil post-connexion : un diaporama de 4 images professionnelles
// qui défilent en fondu. En cliquant sur « Mes agences » (bouton ou rail), les
// agences passent au premier plan et le fond devient l'image floutée — posée
// par AppShell sur la seule page /mes-agences.
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";

const SLIDES = [
  { src: "/image/welcome.jpg", alt: "Planning kanban avec des notes de tâches" },
  { src: "/image/slide1.jpg", alt: "Tableaux de bord de suivi des tâches" },
  { src: "/image/slide2.jpg", alt: "Organisation et suivi des tâches au bureau" },
  { src: "/image/slide3.jpg", alt: "Suivi de la performance des projets" },
];

const AUTOPLAY_MS = 5000;

export default function BienvenuePage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName || user?.email?.split("@")[0] || "";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  // Défilement automatique, mis en pause au survol.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl min-h-[calc(100dvh-var(--header-h)-3rem)] lg:min-h-0 lg:h-[calc(100dvh-var(--header-h)-var(--sheet-gap)-4rem)]"
      style={{
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 24px 60px -28px rgba(0, 0, 0, 0.55)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Diaporama : les images s'enchaînent en fondu. */}
      <AnimatePresence>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.9, ease: "easeInOut" }, scale: { duration: 1.1, ease: "easeOut" } }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width:1024px) 100vw, 1152px"
            quality={82}
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Voiles : dégradé bas-gauche pour le texte + léger assombrissement global. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(4,6,10,0.9) 0%, rgba(4,6,10,0.5) 38%, rgba(4,6,10,0.15) 70%, rgba(4,6,10,0.35) 100%)",
        }}
      />

      {/* Marque en haut à gauche. */}
      <div className="absolute top-5 left-5 lg:top-7 lg:left-8">
        <div className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2">
          <span
            className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            MVP Studio
          </span>
        </div>
      </div>

      {/* Contenu principal, en bas à gauche. Les écrits restent fixes quand
              l'image du diaporama défile : seule l'image change. */}
      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl lg:text-5xl font-black leading-tight text-white drop-shadow">
            Bienvenue, {firstName}
          </h1>
          <p className="mt-3 text-sm lg:text-base text-white/85 max-w-lg drop-shadow">
            Pilotez vos agences, vos projets et vos tâches depuis un seul espace.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/mes-agences"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--gradient-button)",
                backgroundSize: "200% 200%",
                boxShadow: "0 12px 30px -12px rgba(var(--blue-rgb),0.7)",
                animation: "gradient-shift 3s ease infinite",
              }}
            >
              <Building2 className="w-4 h-4" />
              Voir mes agences
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-xs text-white/70">
              En cliquant, vos agences passent au premier plan.
            </span>
          </div>
        </div>
      </div>

      {/* Indicateurs en bas à droite : compteur + pastilles. */}
      <div className="absolute bottom-6 lg:bottom-10 right-6 lg:right-8 flex items-center gap-3">
        <span className="text-xs font-semibold text-white/75 tabular-nums drop-shadow">
          {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Image ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                background: i === index ? "var(--blue-light)" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}