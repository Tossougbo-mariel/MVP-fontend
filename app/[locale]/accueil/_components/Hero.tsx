"use client";

import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import PhoneMockup from "./PhoneMockup";
import { useTranslations } from "next-intl";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT = { once: false, amount: 0.3, margin: "0px 0px -12% 0px" };

const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const wordUp: Variants = {
  hidden: { opacity:  0, y: "45%", filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: "0%",
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function Hero() {
  const t = useTranslations("Landing.hero");
  const words: { text: string; gradient?: boolean }[] = [
     ...t("titleStart").split(" ").map((text) => ({ text })),
    ...t("titleHighlight").split(" ").map((text) => ({ text, gradient: true })),
    ...t("titleEnd").split(" ").map((text) => ({ text })),
  ];

  const heroDescription = t("description");
  
  return (
    <section
      className="relative min-h-screen overflow-hidden bg-[#010b25]"
      style={{ minHeight: "100vh" }}
    >
      {/* Image de fond */}
      <div
        className="absolute -inset-[5%] z-0"
        style={{
          backgroundImage: "url(/image/im.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(0.92)",
          transformOrigin: "center",
          opacity: 0.7,
        }}
      />

      {/* Assombrissement */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: "rgba(1,11,37,0.35)" }}
      />

      {/* Gradient vertical */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(transparent 52.13%, #002989 100%)",
        }}
      />

      {/* Gradient latéral */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(270deg, transparent 39.34%, #010b25cc 100%)",
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex min-h-screen items-center px-4 pt-[var(--nav-h)]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-20 md:grid-cols-[1.2fr_1fr]">
            {/* Texte */}
            <div>
              <motion.h1
                variants={wordContainer}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                {words.map((word, i) => (
                  <span
                    key={`${word.text}-${i}`}
                    className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom"
                    style={{ marginRight: i < words.length - 1 ? "0.28em" : 0 }}
                  >
                    <motion.span
                      variants={wordUp}
                      className="inline-block"
                      style={
                        word.gradient
                          ? {
                              background:
                                "linear-gradient(90deg, var(--blue), var(--blue-light), var(--blue))",
                              backgroundSize: "200% auto",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              animation: "gradient-shift 6s ease infinite",
                            }
                          : undefined
                      }
                    >
                      {word.text}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                transition={{ delay: 1.5 }}
                className="mt-5 max-w-[520px] text-justify text-base font-medium leading-relaxed md:text-lg"
                style={{ color: "#ffffffbf", lineHeight: 1.6 }}
              >
                <p className="sr-only">{heroDescription}</p>
                <div className="overflow-hidden" aria-hidden="true">
                  <div className="hero-marquee-track">
                    <span className="hero-marquee-item">{heroDescription}</span>
                    <span className="hero-marquee-item">{heroDescription}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
                transition={{ delay: 1.85 }}
                className="mt-8 flex flex-col gap-4 sm:flex-row"
              >
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center gap-2 rounded-[100px] bg-[color:var(--blue)] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:brightness-110"
                >
                  {t("primaryCta")}
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-[100px] border border-[#ffffff33] bg-[#ffffff0d] px-8 py-3.5 text-base font-bold text-white backdrop-blur transition-colors hover:bg-[#ffffff1a]"
                >
                  {t("secondaryCta")}
                </a>
              </motion.div>
            </div>
            {/* Mockup téléphone */}
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            >
              <div
                className="animate-float mx-auto w-[200px] lg:w-[220px]"
                style={{ perspective: "1500px" }}
              >
                <div
                  className="overflow-hidden rounded-[24px] bg-[#F3F3EF] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]"
                  style={{
                    aspectRatio: "9/16",
                    transform: "rotateY(-10deg) rotateX(2deg)",
                  }}
                >
                  <PhoneMockup />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
