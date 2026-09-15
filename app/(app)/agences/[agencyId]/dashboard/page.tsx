"use client";

import { motion, type Variants } from "framer-motion";
import {
  FolderKanban, Users, CheckCircle2, Clock, AlertTriangle, Plus,
  ShieldCheck, ListTodo, ArrowLeft, Activity, CalendarClock,
  Lightbulb, Award, AlarmClock, Ban, Crown, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAgencyStore, userRoleInAgency } from "@/app/store/agencyStore";
import { useAuthStore } from "@/app/store/authStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

// 🔮 MOCK : dès que l'API est branchée, ces valeurs viendront des vraies tables
const taskStatuses = [
  { label: "À faire", value: 6, color: "#0c79f2" },
  { label: "En cours", value: 9, color: "#056cf2" },
  { label: "En révision", value: 4, color: "#589bff" },
  { label: "Terminées", value: 5, color: "var(--color-success)" },
  { label: "En retard", value: 2, color: "var(--color-error)" },
];

const weeklyReport = [
  { day: "Lun", value: 3 },
  { day: "Mar", value: 7 },
  { day: "Mer", value: 4 },
  { day: "Jeu", value: 8 },
  { day: "Ven", value: 6 },
  { day: "Sam", value: 2 },
  { day: "Dim", value: 5 },
];

const activity = [
  { text: "Jean a créé la tâche « Créer la maquette du site »", time: "il y a 2 h" },
  { text: "Marie a changé le statut de « Footer » en « En cours »", time: "il y a 5 h" },
  { text: "Paul a terminé la tâche « Configurer le serveur »", time: "hier" },
];

export default function AgencyDashboardPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const user = useAuthStore((s) => s.user);
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));

  // ✅ Rôle dérivé de la fiche membre (owner = créateur, au-dessus des admins promus)
  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  // ✅ Si l'agence n'existe pas ou l'utilisateur n'en est pas membre
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

  if (!user || !agency.members?.some((m) => m.email.toLowerCase() === user.email.toLowerCase())) {
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

  const me = agency.members.find((m) => m.email.toLowerCase() === user.email.toLowerCase());

  return isAdmin ? (
    <AdminDashboard agencyId={agencyId} role={role} userName={me?.firstName ?? user.firstName ?? "vous"} agencyName={agency.name} />
  ) : (
    <MemberDashboard userName={me?.firstName ?? user.firstName ?? "vous"} />
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
  role: "owner" | "admin" | "membre";
  userName: string;
  agencyName: string;
}) {
  const isOwner = role === "owner";
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));

  const members = agency?.members ?? [];
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "actif").length;
  const inactiveMembers = members.filter((m) => m.status === "inactif").length;
  const totalTasks = members.reduce((sum, m) => sum + (m.taskCount ?? 0), 0);
  const maxReport = Math.max(...weeklyReport.map((r) => r.value));

  const statCards = [
    { label: "Total projets", value: "12", icon: FolderKanban, bg: "rgba(5,108,242,0.12)", color: "#056cf2" },
    { label: "Total tâches", value: String(totalTasks || 24), icon: ListTodo, bg: "rgba(139,92,246,0.14)", color: "#7C3AED" },
    { label: "Membres", value: String(totalMembers), icon: Users, bg: "rgba(16,185,129,0.12)", color: "var(--color-success)" },
    { label: "En retard", value: "2", icon: AlarmClock, bg: "rgba(239,68,68,0.12)", color: "var(--color-error)" },
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
          <motion.div key={s.label} variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: s.bg }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none" style={{ color: "var(--text-primary)" }}>{s.value}</div>
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
            <ul className="space-y-2.5">
              {taskStatuses.map((t) => (
                <li key={t.label} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                  <span style={{ color: "var(--text-secondary)" }}>{t.label}</span>
                  <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{t.value}</span>
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
                +18% cette semaine
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyReport.map((r) => (
                <div key={r.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(r.value / maxReport) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-8 rounded-t-lg"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                  <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{r.day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activité récente */}
          <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.14)" }}>
                <Activity size={16} style={{ color: "#7C3AED" }} />
              </div>
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Activité récente</h2>
            </div>
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
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
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
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--color-success)" }} />
                Membres actifs
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{activeMembers}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "var(--color-error)" }} />
                Membres inactifs
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{inactiveMembers}</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#C7961A" }} />
                Tâches cumulées
                <span className="ml-auto font-bold" style={{ color: "var(--text-primary)" }}>{totalTasks}</span>
              </li>
            </ul>
          </motion.div>

          {/* Gestion */}
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

function MemberDashboard({ userName }: { userName: string }) {
  const memberTasks = [
    { label: "À faire", value: 2, icon: CalendarClock, color: "#0c79f2" },
    { label: "En cours", value: 3, icon: Clock, color: "#056cf2" },
    { label: "Terminées", value: 1, icon: CheckCircle2, color: "var(--color-success)" },
    { label: "En retard", value: 1, icon: AlertTriangle, color: "var(--color-error)" },
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
          <motion.div key={s.label} variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${s.color}1F` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bonnes pratiques / Erreurs à éviter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="space-y-3">
          <h4 className="font-bold text-success flex items-center gap-2" style={{ color: "var(--color-success)" }}>
            ✅ Bonnes pratiques
          </h4>
          <img
            src="/bonnes_pratiques.png"
            alt="Bonnes pratiques"
            className="mx-auto rounded-xl mb-2"
            style={{ width: "70%", maxWidth: "220px", height: "auto" }}
          />
          {goodPractices.map((p) => (
            <div
              key={p.title}
              className="glass rounded-2xl p-5 flex items-start gap-4 transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)", borderLeft: "5px solid var(--color-success)" }}
            >
              <p.icon className="w-8 h-8 shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
              <div>
                <h5 className="font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h5>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
              </div>
            </div>
          ))}
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
          {badPractices.map((p) => (
            <div
              key={p.title}
              className="glass rounded-2xl p-5 flex items-start gap-4 transition-transform duration-300 hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)", borderLeft: "5px solid var(--color-error)" }}
            >
              <p.icon className="w-8 h-8 shrink-0 mt-0.5" style={{ color: "var(--color-error)" }} />
              <div>
                <h5 className="font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</h5>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{p.desc}</p>
              </div>
            </div>
          ))}
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