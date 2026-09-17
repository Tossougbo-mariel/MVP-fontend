"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft, CalendarClock, CheckCircle2, Flag, Search,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useAuthStore } from "@/app/store/authStore";
import {
  LABEL_STATUS, LABEL_PRIORITY, overdueTasks,
  type TaskStatus, type TaskPriority,
} from "@/lib/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  a_faire: "#0c79f2",
  en_cours: "#056cf2",
  en_revision: "#589bff",
  terminee: "var(--color-success)",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  basse: "var(--text-muted)",
  moyenne: "#056cf2",
  haute: "#d97706",
  urgente: "var(--color-error)",
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

export default function MesTachesPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const user = useAuthStore((s) => s.user);
  const { agencyById, myTasksInAgency, data } = useAppData();

  const agency = agencyById(agencyId);

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "toutes">("toutes");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "toutes">("toutes");
  const [search, setSearch] = useState("");

  const allTasks = myTasksInAgency(agencyId);

  const tasks = useMemo(() => {
    let list = allTasks;
    if (statusFilter !== "toutes") list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "toutes") list = list.filter((t) => t.priority === priorityFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.projectName ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [allTasks, statusFilter, priorityFilter, search]);

  const overdue = useMemo(() => overdueTasks(tasks), [tasks]);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Agence introuvable
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Mes agences
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Mes tâches
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {agency.name} — {tasks.length} tâche(s)
              {overdue.length > 0 && (
                <span className="ml-2 font-semibold" style={{ color: "var(--color-error)" }}>
                  · {overdue.length} en retard
                </span>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une tâche…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "toutes")}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
        >
          <option value="toutes">Tous les statuts</option>
          {(Object.keys(LABEL_STATUS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>{LABEL_STATUS[s]}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "toutes")}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
        >
          <option value="toutes">Toutes les priorités</option>
          {(Object.keys(LABEL_PRIORITY) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>{LABEL_PRIORITY[p]}</option>
          ))}
        </select>
      </motion.div>

      {tasks.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center gap-4 min-h-[40vh] text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            {allTasks.length === 0
              ? `Aucune tâche assignée, ${user?.firstName ?? ""}.`
              : "Aucune tâche ne correspond à vos filtres."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const isOverdue =
              t.deadline !== null &&
              t.status !== "terminee" &&
              t.deadline < new Date().toISOString().slice(0, 10);
            const statusColor = STATUS_COLORS[t.status];
            const prioColor = PRIORITY_COLORS[t.priority];
            return (
              <motion.div key={t.id} variants={item}>
                <Link
                  href={`/agences/${agencyId}/projets/${t.projectId}/taches/${t.id}`}
                  className="block glass rounded-2xl p-5 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${prioColor}1F` }}
                    >
                      <Flag className="w-5 h-5" style={{ color: prioColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {t.title}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: statusColor, background: `${statusColor}1F` }}
                        >
                          {LABEL_STATUS[t.status]}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: prioColor, background: `${prioColor}1F` }}
                        >
                          {LABEL_PRIORITY[t.priority]}
                        </span>
                        {isOverdue && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: "var(--color-error)", background: "rgba(239,68,68,0.12)" }}
                          >
                            En retard
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Projet : {t.projectName}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {t.deadline && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={12} /> Échéance : {formatDate(t.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
