"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { useAgencyStore } from "@/app/store/agencyStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const MotionLink = motion(Link);

export default function MesAgencesPage() {
  const agencies = useAgencyStore((s) => s.agencies);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {agencies.length > 0 && (
        <motion.div variants={item}>
          <h1 className="text-2xl lg:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            Mes agences
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Les espaces de travail auxquels vous appartenez.
          </p>
        </motion.div>
      )}

      {agencies.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-6 min-h-[60vh]"
        >
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              {"Vous n'avez aucune agence pour le moment."}
            </p>
            <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
              Créez votre première agence pour commencer à collaborer.
            </p>
          </div>
          <Link
            href="/agences/nouvelle"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{
              background: "var(--gradient-button)",
              boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)",
            }}
          >
            <Plus className="w-5 h-5" />
            Créer une agence
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agencies.map((a) => (
            <MotionLink
              key={a.id}
              href={`/agences/${a.id}/dashboard`}
              variants={item}
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass rounded-2xl p-5 flex flex-col gap-4 cursor-pointer"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 12px -4px rgba(37,99,235,0.35)" }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                      {a.name}
                    </div>
                    <span
                      className="inline-flex mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={
                        a.role === "admin"
                          ? { background: "var(--gradient-button)", color: "#fff" }
                          : {
                              background: "var(--surface)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                            }
                      }
                    >
                      {a.role === "admin" ? "Administrateur" : "Membre"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              </div>
            </MotionLink>
          ))}
        </div>
      )}
    </motion.div>
  );
}