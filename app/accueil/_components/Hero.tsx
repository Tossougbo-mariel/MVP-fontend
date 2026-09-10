"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PhoneMockup from "./PhoneMockup";

export default function Hero() {
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
      <div className="relative z-10 flex min-h-screen items-center px-4 pt-[var(--nav-h)] sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid items-center gap-20 md:grid-cols-[1.2fr_1fr]">
            {/* Texte */}
            <div>
              <h1
                className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                Pilotez vos{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #056cf2, #9dc7ff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  agences et vos équipes
                </span>{" "}
                avec précision
              </h1>

              <p
                className="mt-5 max-w-[520px] text-justify text-base leading-relaxed md:text-lg"
                style={{ color: "#ffffffbf", lineHeight: 1.6 }}
              >
                MVP Manager centralise vos agences, projets et tâches dans un
                tableau de bord élégant. Suivez chaque mission, pilotez chaque
                équipe — simplement.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center gap-2 rounded-[100px] bg-[#056cf2] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:brightness-110"
                >
                  Démarrer gratuitement
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-[100px] border border-[#ffffff33] bg-[#ffffff0d] px-8 py-3.5 text-base font-bold text-white backdrop-blur transition-colors hover:bg-[#ffffff1a]"
                >
                  En savoir plus
                </a>
              </div>
            </div>
{/* Mockup téléphone */}
            <div className="hidden md:block">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
