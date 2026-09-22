"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FolderKanban, Users, CheckCircle2, Clock, AlertTriangle, Plus,
  ShieldCheck, ListTodo, ArrowLeft, CalendarClock,
  Lightbulb, Award, AlarmClock, Ban, Crown, TrendingUp,
  History, CalendarPlus, Flag, UserRound, MessageSquare, Pencil,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData, useAsync } from "@/lib/appData";
import { fetchActivity } from "@/lib/services";
import { userRoleInAgency, type AgencyRole, overdueTasks, ACTIVITY_LABELS } from "@/lib/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};



const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.floor((Date.now() - then) / 1000);
  if (diffSeconds < 60) return "à l'instant";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem`;
  return new Date(iso).toLocaleDateString("fr-FR");
};

const activityConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  creation: { label: ACTIVITY_LABELS["creation"], color: "var(--color-success)", bg: "rgba(16,185,129,0.12)", icon: CalendarPlus },
  changement_statut: { label: ACTIVITY_LABELS["changement_statut"], color: "#056cf2", bg: "var(--accent-soft)", icon: Flag },
  changement_responsable: { label: ACTIVITY_LABELS["changement_responsable"], color: "#7c3aed", bg: "rgba(139,92,246,0.12)", icon: UserRound },
  changement_priorite: { label: ACTIVITY_LABELS["changement_priorite"], color: "#d97706", bg: "rgba(245,158,11,0.15)", icon: Flag },
  changement_echeance: { label: ACTIVITY_LABELS["changement_echeance"], color: "#db2777", bg: "rgba(219,39,119,0.12)", icon: CalendarClock },
  commentaire: { label: ACTIVITY_LABELS["commentaire"], color: "var(--accent-text)", bg: "var(--accent-soft)", icon: MessageSquare },
};

const smoothCurve = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export default function AgencyDashboardPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const user = useAuthStore((s) => s.user);
  const { agencyById, data } = useAppData();
  const agency = agencyById(agencyId);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

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

  if (!user || !agency.members?.some((m) => m.user.email.toLowerCase() === user.email.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Vous n&apos;êtes pas membre de cette agence.
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour à Mes agences
        </Link>
      </div>
    );
  }

  const me = agency.members.find((m) => m.user.email.toLowerCase() === user.email.toLowerCase());

  return isAdmin ? (
    <AdminDashboard agencyId={agencyId} role={role} userName={me?.user.firstName ?? user.firstName ?? "vous"} agencyName={agency.name} />
  ) : (
    <MemberDashboard userName={me?.user.firstName ?? user.firstName ?? "vous"} agencyId={agencyId} />
  );
}

/* ============ FIL D'ARIANE ============ */
function Breadcrumb({ title, agencyName }: { title: string; agencyName: string }) {
  return (
    <motion.div variants={item}>
      <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <nav className="mt-1 text-xs">
        <ol className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <li>
            <Link href="/mes-agences" className="hover:underline" style={{ color: "var(--text-muted)" }}>
              Mes agences
            </Link>
          </li>
          <li>/</li>
          <li>{agencyName}</li>
          <li>/</li>
          <li className="font-semibold" style={{ color: "#056cf2" }}>Dashboard</li>
        </ol>
      </nav>
    </motion.div>
  );
}

/* ============ BANNIÈRE DE BIENVENUE ============ */
function WelcomeBanner({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <motion.div
      variants={item}
      className="relative overflow-hidden rounded-3xl px-6 py-5 md:px-8 md:py-6 text-white"
      style={{
        background: "var(--banner-gradient)",
        boxShadow: "var(--banner-shadow)",
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, var(--banner-glow) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 right-24 w-40 h-40 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, var(--banner-circle) 0%, transparent 70%)" }}
      />
      <div className="relative">
        <div className="text-xl md:text-2xl font-black leading-snug">
          Bienvenue, {name} ! 👋
        </div>
        <p className="mt-1 text-sm opacity-90 max-w-2xl">{subtitle}</p>
      </div>
    </motion.div>
  );
}

/* ============ VUE ADMIN : accès complet (propriétaire) / élargi (admin promu) ============ */
function AdminDashboard({
  agencyId,
  role,
  userName,
  agencyName,
}: {
  agencyId: string;
  role: AgencyRole;
  userName: string;
  agencyName: string;
}) {
  const isOwner = role === "owner";
  const { agencyById, tasksByAgency, projectsByAgency } = useAppData();
  const agency = agencyById(agencyId);

  const { data: activity, loading: activityLoading } = useAsync(
    () => fetchActivity({ agencyId }),
    [agencyId],
  );
  const [activityExpanded, setActivityExpanded] = useState(false);
  const ACTIVITY_VISIBLE = 5;

  const members = agency?.members ?? [];
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "actif").length;
  const inactiveMembers = members.filter((m) => m.status === "inactif").length;

  const agencyTasks = tasksByAgency(agencyId);
  const agencyProjects = projectsByAgency(agencyId);
  const totalTasks = agencyTasks.length;
  const totalProjects = agencyProjects.length;
  const overdueCount = overdueTasks(
    agencyTasks.map((t) => ({ deadline: t.dueDate, status: t.status })),
  ).length;

  const WEEK_DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Lundi de la semaine courante à 00:00
  const thisWeekStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  })();

  // Lundi de la semaine précédente
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  // Compte les tâches terminées (completedAt) jour par jour dans un intervalle
  const countDone = (from: Date, to: Date): number[] => {
    const counts = Array(7).fill(0) as number[];
    for (const t of agencyTasks) {
      if (t.status !== "terminee" || !t.completedAt) continue;
      const completed = new Date(t.completedAt);
      if (completed >= from && completed < to) {
        counts[(completed.getDay() + 6) % 7]++;
      }
    }
    return counts;
  };

  const thisWeek = countDone(thisWeekStart, new Date(thisWeekStart.getTime() + 7 * 86400000));
  const lastWeek = countDone(lastWeekStart, thisWeekStart);

  const weeklyReport = WEEK_DAY_LABELS.map((day, i) => ({ day, value: thisWeek[i] }));

  const doneThisWeek = thisWeek.reduce((s, n) => s + n, 0);
  const doneLastWeek = lastWeek.reduce((s, n) => s + n, 0);
  const deltaPct: number | null =
    doneLastWeek === 0
      ? doneThisWeek > 0
        ? 100
        : null
      : Math.round(((doneThisWeek - doneLastWeek) / doneLastWeek) * 100);
  const taskStatuses = [
    { label: "À faire", value: agencyTasks.filter((t) => t.status === "a_faire").length, color: "#0c79f2" },
    { label: "En cours", value: agencyTasks.filter((t) => t.status === "en_cours").length, color: "#056cf2" },
    { label: "En révision", value: agencyTasks.filter((t) => t.status === "en_revision").length, color: "#589bff" },
    { label: "Terminées", value: agencyTasks.filter((t) => t.status === "terminee").length, color: "var(--color-success)" },
    { label: "En retard", value: overdueCount, color: "var(--color-error)" },
  ];

  const maxReport = Math.max(1, ...weeklyReport.map((r) => r.value));

  // Géométrie du graphique — courbe lissée (smooth curve)
  const chartWidth = 640;
  const chartHeight = 166;
  const chartTop = 16;
  const chartBottom = 30;
  const chartMax = Math.max(10, Math.ceil((maxReport * 1.25) / 2) * 2);
  const points = weeklyReport.map((r, i) => ({
    x: 28 + ((chartWidth - 56) / (weeklyReport.length - 1)) * i,
    y: chartTop + (1 - r.value / chartMax) * (chartHeight - chartTop - chartBottom),
  }));
  const linePath = smoothCurve(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartBottom} L ${points[0].x} ${
    chartHeight - chartBottom
  } Z`;
  const avg = weeklyReport.reduce((s, r) => s + r.value, 0) / weeklyReport.length;
  const avgY = chartTop + (1 - avg / chartMax) * (chartHeight - chartTop - chartBottom);

  const statCards = [
    { label: "Total projets", value: String(totalProjects), icon: FolderKanban, grad: "linear-gradient(135deg, rgba(88,155,255,0.35), rgba(5,108,242,0.10))", color: "#6ea8ff" },
    { label: "Total tâches", value: String(totalTasks), icon: ListTodo, grad: "linear-gradient(135deg, rgba(88,155,255,0.35), rgba(5,108,242,0.10))", color: "#6ea8ff" },
    { label: "Membres", value: String(totalMembers), icon: Users, grad: "linear-gradient(135deg, rgba(88,155,255,0.35), rgba(5,108,242,0.10))", color: "#6ea8ff" },
    { label: "En retard", value: String(overdueCount), icon: AlarmClock, grad: "linear-gradient(135deg, rgba(88,155,255,0.35), rgba(5,108,242,0.10))", color: "#6ea8ff" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <Breadcrumb title="Tableau de bord" agencyName={agencyName} />

      <WelcomeBanner
        name={userName}
        subtitle={
          isOwner
            ? "En tant que propriétaire, prenez des décisions éclairées et libérez le potentiel de votre équipe."
            : "En tant qu'administrateur, organisez, suivez et motivez votre équipe."
        }
      />

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden glass rounded-2xl p-5 cursor-default"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: s.grad, opacity: 0.5 }}
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative flex items-center gap-3.5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                whileHover={{ rotate: 8, scale: 1.1 }}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #E8F2FF 0%, #C9DEFF 100%)", border: `1px solid ${s.color}66` }}
              >
                <s.icon className="w-5 h-5" style={{ color: "#2e70d0" }} />
              </motion.div>
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl font-black leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.value}
                </motion.div>
                <div className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="xl:col-span-2 space-y-6">
          {/* Répartition des tâches */}
          <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(5,108,242,0.12)" }}>
                <CalendarClock size={16} style={{ color: "#056cf2" }} />
              </div>
              <div>
                <h2 className="font-bold leading-none" style={{ color: "var(--text-primary)" }}>Tâches par statut</h2>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Vue d&apos;ensemble de l&apos;avancement</span>
              </div>
            </div>
            <ul className="space-y-3">
              {taskStatuses.map((t, i) => (
                <li key={t.label} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                  <span style={{ color: "var(--text-secondary)" }}>{t.label}</span>
                  <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{t.value}</span>
                  <div className="w-20 h-1.5 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.value / Math.max(...taskStatuses.map((x) => x.value))) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: t.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Rapport hebdomadaire */}
          <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <TrendingUp size={16} style={{ color: "var(--color-success)" }} />
                </div>
                <div>
                  <h2 className="font-bold leading-none" style={{ color: "var(--text-primary)" }}>Rapport hebdomadaire</h2>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tâches terminées par jour</span>
                </div>
              </div>
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }}
              >
                {deltaPct === null
                  ? `${doneThisWeek} terminée${doneThisWeek > 1 ? "s" : ""} cette semaine`
                  : `${deltaPct >= 0 ? "+" : ""}${deltaPct}% cette semaine`}
              </span>
            </div>
            <div className="mb-4 flex items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span className="w-4 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #056cf2, #589bff)" }} />
                Tâches terminées
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <span className="w-4 border-t border-dashed" style={{ borderColor: "#7C3AED" }} />
                Moyenne journalière
              </span>
            </div>

            <div className="relative">
              <svg viewBox="0 0 640 200" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0c79f2" />
                    <stop offset="55%" stopColor="#589bff" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#056cf2" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#056cf2" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 16 + (i / 4) * 150;
                  const label = Math.round((maxReport * 1.25 * (4 - i)) / 4);
                  return (
                    <g key={i}>
                      <line x1="28" y1={y} x2="612" y2={y} stroke="rgba(155,170,220,0.14)" strokeDasharray="4 4" />
                      <text x="0" y={y + 3} fontSize="9" fill="var(--text-muted)" fontWeight="500">
                        {label}
                      </text>
                    </g>
                  );
                })}

                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  d={areaPath}
                  fill="url(#chartArea)"
                  style={{ opacity: 0 }}
                />
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  d={linePath}
                  fill="none"
                  stroke="url(#chartLine)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(5,108,242,0.45))" }}
                />

                <line x1="28" y1={avgY} x2="612" y2={avgY} stroke="#7C3AED" strokeDasharray="5 4" strokeWidth="1" opacity="0.7" />

                {weeklyReport.map((r, i) => (
                  <g key={r.day} className="group">
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 260, damping: 16 }}
                      cx={points[i].x}
                      cy={points[i].y}
                      r="10"
                      fill="rgba(5,108,242,0.15)"
                      className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 cursor-pointer"
                    />
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 260, damping: 16 }}
                      cx={points[i].x}
                      cy={points[i].y}
                      r="4"
                      fill="#0c79f2"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="1.5"
                      className="cursor-pointer"
                    />
                    <circle cx={points[i].x} cy={points[i].y} r="7" fill="transparent" className="cursor-pointer" />
                    <motion.text
                      initial={{ opacity: 0, y: 4 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      textAnchor="middle"
                      x={points[i].x}
                      y={points[i].y - 14}
                      fontSize="11"
                      fontWeight="700"
                      fill="#9dc7ff"
                    >
                      {r.value}
                    </motion.text>
                    <text textAnchor="middle" x={points[i].x} y="196" fontSize="10" fill="var(--text-muted)" fontWeight="600">
                      {r.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </motion.div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Activité récente — à côté, comme l'historique des tâches */}
          <motion.div variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-bold flex items-center gap-2.5 mb-3" style={{ color: "var(--text-primary)" }}>
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(139,92,246,0.15)" }}
              >
                <History size={14} style={{ color: "#7c3aed" }} />
              </span>
              Activité récente
            </h2>

            {activityLoading ? (
              <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
                Chargement de l&apos;activité…
              </p>
            ) : activity && activity.length > 0 ? (
              <>
                {(() => {
                  const visible = activity.slice(0, activityExpanded ? activity.length : ACTIVITY_VISIBLE);
                  return (
                    <div className="flex flex-col">
                      {visible.map((a, idx) => {
                        const cfg = activityConfig[a.action] ?? {
                          label: a.action,
                          color: "var(--text-secondary)",
                          bg: "var(--hover-soft)",
                          icon: History,
                        };
                        const Icon = cfg.icon;
                        const isLast = idx === visible.length - 1;
                        return (
                          <div key={a.id} className="flex gap-3">
                            <div className="flex flex-col items-center shrink-0">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: cfg.bg }}
                              >
                                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 min-h-3" style={{ background: "var(--border-subtle)" }} />
                              )}
                            </div>

                            <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-3"}`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                  {a.description ?? a.action}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ color: cfg.color, background: cfg.bg }}
                                >
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {a.actorName ?? a.actorEmail} · {timeAgo(a.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {activity.length > ACTIVITY_VISIBLE && (
                  <button
                    onClick={() => setActivityExpanded((v) => !v)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-[var(--hover-soft)]"
                    style={{ color: "#056cf2", background: "rgba(5,108,242,0.08)" }}
                  >
                    {activityExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {activityExpanded
                      ? "Voir moins"
                      : `Voir plus (${activity.length - ACTIVITY_VISIBLE})`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
                Aucune activité récente.
              </p>
            )}
          </motion.div>

          {/* Statut de l'équipe */}
          <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(5,108,242,0.12)" }}>
                <Users size={16} style={{ color: "#056cf2" }} />
              </div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Statut de l&apos;équipe</h2>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm">
                <span className="relative w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--color-success)" }}>
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--color-success)" }}
                    animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </span>
                Membres actifs
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{activeMembers}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--color-error)", boxShadow: "0 0 8px var(--color-error)" }} />
                Membres inactifs
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{inactiveMembers}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#C7961A", boxShadow: "0 0 8px #C7961A" }} />
                Tâches cumulées
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{totalTasks}</span>
              </li>
            </ul>
          </motion.div>

          {/* Gestion (masqué pour le propriétaire) */}
          {!isOwner && (
            <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(221,166,28,0.14)" }}>
                  <Crown size={16} style={{ color: "#C7961A" }} />
                </div>
                <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Gestion</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Créer un projet", href: `/agences/${agencyId}/projets/nouveau`, icon: Plus },
                  { label: "Gérer l'équipe", href: `/agences/${agencyId}/equipe`, icon: Users },
                  { label: "Voir les tâches", href: `/agences/${agencyId}/mes-taches`, icon: ListTodo },
                ].map((b, index) => (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group"
                  >
                    <Link
                      href={b.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200"
                      style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                    >
                      <motion.span
                        whileHover={{ rotate: 8, scale: 1.12 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                        style={{ background: "rgba(5,108,242,0.12)" }}
                      >
                        <b.icon className="w-4.5 h-4.5" style={{ color: "#056cf2" }} />
                      </motion.span>
                      <span className="font-medium text-sm group-hover:text-[#589bff] transition-colors duration-200">{b.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Droits */}
          <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4" style={{ color: "#056cf2" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {isOwner
                  ? "Vue propriétaire — accès complet"
                  : "Vue administrateur — accès élargi mais limité"}
              </p>
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {isOwner ? "Vous gérez tout : équipe, projets, tâches et réglages." : "Vous gérez l'équipe et les projets, sans les réglages."
            }
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============ VUE MEMBRE : vue personnelle, accès limité ============ */
const goodPractices = [
  {
    icon: Lightbulb,
    title: "Respectez les délais",
    desc: "Livrez chaque tâche à temps pour garder la confiance de l'équipe.",
  },
  {
    icon: Award,
    title: "Travaillez avec rigueur",
    desc: "La qualité de vos livrables reflète votre professionnalisme.",
  },
  {
    icon: Users,
    title: "Collaborez avec l'équipe",
    desc: "Une bonne communication améliore la productivité du projet.",
  },
];

const badPractices = [
  {
    icon: AlarmClock,
    title: "Ne soyez pas en retard",
    desc: "Les retards ralentissent toute l'équipe et nuisent au planning.",
  },
  {
    icon: Ban,
    title: "Ne négligez pas les détails",
    desc: "Des livrables incomplets bloquent l'avancement du projet.",
  },
  {
    icon: AlertTriangle,
    title: "Évitez les conflits",
    desc: "Un climat sain favorise la réussite collective.",
  },
];

function MemberDashboard({ userName, agencyId }: { userName: string; agencyId: string }) {
  const { myTasksInAgency } = useAppData();
  const myT = myTasksInAgency(agencyId);

  const today = new Date().toISOString().slice(0, 10);
  const memberTasks = [
    { label: "À faire", value: myT.filter((t) => t.status === "a_faire").length, icon: CalendarClock, color: "#6ea8ff" },
    { label: "En cours", value: myT.filter((t) => t.status === "en_cours").length, icon: Clock, color: "#589bff" },
    { label: "Terminées", value: myT.filter((t) => t.status === "terminee").length, icon: CheckCircle2, color: "var(--color-success)" },
    { label: "En retard", value: myT.filter((t) => t.status !== "terminee" && t.deadline !== null && t.deadline < today).length, icon: AlertTriangle, color: "var(--color-error)" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <WelcomeBanner
        name={userName}
        subtitle="Découvrez les bonnes pratiques pour exceller dans votre travail."
      />

      {/* Mes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {memberTasks.map((s) => (
          <motion.div
            key={s.label}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative overflow-hidden glass rounded-2xl p-5 cursor-default"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #E8F2FF 0%, #C9DEFF 100%)", opacity: 0.4 }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative flex items-center gap-3.5">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                whileHover={{ rotate: 8, scale: 1.1 }}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #E8F2FF 0%, #C9DEFF 100%)", border: `1px solid ${s.color}66` }}
              >
                <s.icon className="w-5 h-5" style={{ color: "#2e70d0" }} />
              </motion.div>
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl font-black leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.value}
                </motion.div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bonnes pratiques / Erreurs à éviter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="space-y-3">
          <h4 className="font-bold flex items-center gap-2" style={{ color: "var(--color-success)" }}>
            ✅ Bonnes pratiques
          </h4>
          <img
            src="/bonnes_pratiques.png"
            alt="Bonnes pratiques"
            className="mx-auto rounded-xl mb-2"
            style={{ width: "70%", maxWidth: "220px", height: "auto" }}
          />
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-3"
          >
            {goodPractices.map((p) => (
              <motion.div
                key={p.title}
                variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
                whileHover={{ x: 4, scale: 1.01 }}
                className="glass rounded-2xl p-5 flex items-start gap-4"
                style={{
                  boxShadow: "var(--shadow-card)",
                  borderLeft: "5px solid var(--color-success)",
                  background: "rgba(16,185,129,0.06)",
                }}
              >
                <motion.div whileHover={{ rotate: 10, scale: 1.15 }} className="w-8 h-8 shrink-0 mt-0.5">
                  <p.icon className="w-8 h-8" style={{ color: "var(--color-success)" }} />
                </motion.div>
                <div>
                  <h5 className="font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h5>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div variants={item} className="space-y-3">
          <h4 className="font-bold flex items-center gap-2" style={{ color: "var(--color-error)" }}>
            ❌ Erreurs à éviter
          </h4>
          <img
            src="/mauvaises_pratiques.png"
            alt="Erreurs à éviter"
            className="mx-auto rounded-xl mb-2"
            style={{ width: "70%", maxWidth: "220px", height: "auto" }}
          />
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-3"
          >
            {badPractices.map((p) => (
              <motion.div
                key={p.title}
                variants={{ hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
                whileHover={{ x: -4, scale: 1.01 }}
                className="glass rounded-2xl p-5 flex items-start gap-4"
                style={{
                  boxShadow: "var(--shadow-card)",
                  borderLeft: "5px solid var(--color-error)",
                  background: "rgba(239,68,68,0.06)",
                }}
              >
                <motion.div whileHover={{ rotate: -10, scale: 1.15 }} className="w-8 h-8 shrink-0 mt-0.5">
                  <p.icon className="w-8 h-8" style={{ color: "var(--color-error)" }} />
                </motion.div>
                <div>
                  <h5 className="font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h5>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(5,108,242,0.12)" }}>
            <FolderKanban size={16} style={{ color: "#056cf2" }} />
          </div>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Vos projets</h2>
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ici s&apos;afficheront les projets auxquels vous participez.
        </div>
      </motion.div>
    </motion.div>
  );
}
