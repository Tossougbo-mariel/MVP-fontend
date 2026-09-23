import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-16 md:py-20" style={{ background: "#010e2e" }}>
      {/* Glow radial */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(var(--blue-rgb), 0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, var(--blue), var(--blue-light))" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
        </div>

        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Prêt à passer à la{" "}
          <span
            style={{
              background: "linear-gradient(90deg, var(--blue), var(--blue-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            vitesse supérieure
          </span>{" "}
          ?
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-8" style={{ color: "#ffffffC7" }}>
          Rejoignez des centaines d&apos;équipes qui organisent leurs agences,
          leurs projets et leurs tâches avec MVP Manager. C&apos;est gratuit
          pour commencer.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center gap-2 rounded-[100px] bg-[color:var(--blue)] px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:brightness-110"
          >
            Créer mon compte gratuit
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/connexion"
            className="rounded-[100px] border border-[#ffffff33] bg-[#ffffff0d] px-10 py-4 text-base font-bold text-white backdrop-blur transition-colors hover:bg-[#ffffff1a]"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>
      </div>
    </section>
  );
}
