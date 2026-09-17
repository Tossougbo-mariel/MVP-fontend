"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { userAgencies, userRoleInAgency } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/services";

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
  const user = useAuthStore((s) => s.user);
  const { data } = useAppData();
  const allAgencies = data.agencies;
  const agencies = userAgencies(allAgencies, user?.email ?? "");

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--border-subtle)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-bold" style={{ color: "var(--color-error)" }}>
          {getApiErrorMessage(data.error)}
        </p>
      </div>
    );
  }

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
          {agencies.map((a) => {
            const role = userRoleInAgency(a, user?.email ?? "");
            return (
            <MotionLink
              key={a.id}
              href={`/agences/${a.id}/dashboard`}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass relative rounded-3xl p-5 pt-7 flex flex-col gap-4 cursor-pointer overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "var(--gradient-primary)" }} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--gradient-primary)", boxShadow: "0 6px 16px -6px rgba(37,99,235,0.45)" }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate text-lg" style={{ color: "var(--text-primary)" }}>
                      {a.name}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={
                        role === "membre"
                          ? {
                              background: "var(--surface)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                            }
                          : {
                              background: "var(--gradient-button)",
                              color: "#fff",
                              boxShadow: "0 4px 10px -5px rgba(37,99,235,0.45)",
                            }
                      }
                    >
                      {role === "owner" ? "Propriétaire" : role === "admin" ? "Administrateur" : "Membre"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "var(--text-muted)" }} />
              </div>

              <div
                className="flex items-center justify-between pt-3 text-xs"
                style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
              >
                <span>{(a.members ?? []).length} membre{(a.members ?? []).length > 1 ? "s" : ""}</span>
                <span>Créée le {a.createdAt}</span>
              </div>
            </MotionLink>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
