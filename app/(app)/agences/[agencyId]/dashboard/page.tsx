"use client";

import { motion, type Variants } from "framer-motion";
import {
  FolderKanban, Users, CheckCircle2, Clock, AlertTriangle, Plus,
  UserRound, ShieldCheck, CalendarClock, ListTodo,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAgencyStore } from "@/app/store/agencyStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// 🔮 MOCK : dès que l'API est branchée, ce rôle viendra de agence_members.role
// (l'utilisateur est admin s'il a créé l'agence, membre s'il a été invité)
type Role = "admin" | "membre";

const adminStats = [
  { label: "Total tâches", value: "24", icon: ListTodo, color: "var(--text-primary)" },
  { label: "À faire", value: "6", icon: CalendarClock, color: "#0c79f2" },
  { label: "En cours", value: "9", icon: Clock, color: "#056cf2" },
  { label: "En révision", value: "4", icon: FolderKanban, color: "#589bff" },
  { label: "En retard", value: "2", icon: AlertTriangle, color: "#EF4444" },
];

const memberTasks = [
  { label: "À faire", value: 2, icon: CalendarClock, color: "#0c79f2" },
  { label: "En cours", value: 3, icon: Clock, color: "#056cf2" },
  { label: "Terminées", value: 1, icon: CheckCircle2, color: "var(--color-success)" },
  { label: "En retard", value: 1, icon: AlertTriangle, color: "#EF4444" },
];

const activity = [
  { text: "Jean a créé la tâche « Créer la maquette du site »", time: "il y a 2 h" },
  { text: "Marie a changé le statut de « Footer » en « En cours »", time: "il y a 5 h" },
  { text: "Paul a terminé la tâche « Configurer le serveur »", time: "hier" },
];

export default function AgencyDashboardPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const role =
    (useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId)?.role) as Role | undefined) ??
    "membre";
  return role === "admin" ? <AdminDashboard agencyId={agencyId} /> : <MemberDashboard />;
}

/* ============ VUE ADMIN : accès complet ============ */
function AdminDashboard({ agencyId }: { agencyId: string }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
          Tableau de bord
        </h1>
        <p className="flex items-center gap-1.5 mt-1" style={{ color: "var(--text-secondary)" }}>
          <ShieldCheck className="w-4 h-4" style={{ color: "#056cf2" }} />
          Vue administrateur — accès complet
        </p>
      </motion.div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {adminStats.map((s) => (
          <motion.div key={s.label} variants={item} className="glass rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Activité récente */}
        <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Activité récente</h2>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.text} className="flex items-start gap-3 text-sm">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#056cf2" }} />
                <div>
                  <div style={{ color: "var(--text-primary)" }}>{a.text}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Actions rapides admin */}
        <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>{"Gestion — réservé à l'admin"}</h2>
          <div className="space-y-3">
            {[
              { label: "Créer un projet", href: `/agences/${agencyId}/projets/nouveau`, icon: Plus },
              { label: "Gérer l'équipe", href: `/agences/${agencyId}/equipe`, icon: Users },
              { label: "Créer une tâche", href: `/agences/${agencyId}/mes-taches`, icon: CheckCircle2 },
            ].map((b) => (
              <Link
                key={b.label}
                href={b.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              >
                <b.icon className="w-5 h-5" style={{ color: "#056cf2" }} />
                <span className="font-medium text-sm">{b.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ============ VUE MEMBRE : vue personnelle, accès limité ============ */
function MemberDashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Tableau de bord</h1>
        <p className="flex items-center gap-1.5 mt-1" style={{ color: "var(--text-secondary)" }}>
          <UserRound className="w-4 h-4" />
          Vue membre — vos tâches uniquement
        </p>
      </motion.div>

      {/* Mes tâches */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {memberTasks.map((s) => (
          <motion.div key={s.label} variants={item} className="glass rounded-2xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Vos projets</h2>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {"Ici s'afficheront les projets auxquels vous participez."}
        </div>
      </motion.div>
    </motion.div>
  );
}