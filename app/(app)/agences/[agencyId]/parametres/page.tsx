"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Settings, Users, Mail, Trash2, CheckCircle2, Save,
  AlertTriangle, Globe, LayoutGrid, List, Kanban, X, Bell, Clock,
} from "lucide-react";
import { useAgencyStore, userRoleInAgency } from "@/app/store/agencyStore";
import { useAuthStore } from "@/app/store/authStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: "var(--text-primary)" }}>
        {icon} {title}
      </h2>
      {children}
    </motion.div>
  );
}

export default function ParametresPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));
  const removeAgency = useAgencyStore((s) => s.removeAgency);
  const updateAgencySettings = useAgencyStore((s) => s.updateAgencySettings);
  const invitations = useNotificationsStore((s) => s.invitations);
  const cancelInvitation = useNotificationsStore((s) => s.cancelInvitation);

  // ====== États (toujours déclarés AVANT tout retour anticipé) ======
  const [agencyNameDraft, setAgencyNameDraft] = useState(agency?.name ?? "");
  const [saved, setSaved] = useState(false);

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Agence introuvable</p>
        <Link href="/mes-agences" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--gradient-button)" }}>
          <ArrowLeft size={16} /> Mes agences
        </Link>
      </div>
    );
  }

  const role = user ? userRoleInAgency(agency, user.email) : "membre";
  if (!user || role !== "owner") {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center justify-center gap-6 min-h-[50vh] text-center">
        <motion.div variants={item} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
          <ShieldCheck className="w-8 h-8" style={{ color: "var(--color-error)" }} />
        </motion.div>
        <motion.div variants={item}>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Accès réservé au propriétaire</p>
          <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
            Seul {agency.createdBy} — qui a créé {agency.name} — peut modifier les paramètres.
          </p>
        </motion.div>
        <motion.div variants={item}>
          <Link href={`/agences/${agencyId}/dashboard`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--gradient-button)" }}>
            <ArrowLeft size={16} /> Retour au tableau de bord
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const agencyInvitations = invitations.filter(
    (i) => i.agencyId === agencyId && i.status === "pending"
  );

  const settings = agency.settings ?? {
    whoCanInvite: "owner",
    whoCanCreateProjects: "admin",
    defaultTaskView: "grid",
    agencyName: agency.name,
    defaultMemberRole: "membre" as const,
    emailNotifications: true,
  };

  const handleSaveSettings = () => {
    updateAgencySettings(agencyId, {
      agencyName: agencyNameDraft.trim() || agency.name,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAgency = () => {
    if (window.confirm(`Supprimer définitivement "${agency.name}" ? Tous les membres, projets et données seront perdus.`)) {
      if (window.confirm("Dernière chance : êtes-vous sûr ?")) {
        removeAgency(agencyId);
        router.push("/mes-agences");
      }
    }
  };

  const handleCancelInvitation = (id: string, email: string) => {
    if (window.confirm(`Annuler l'invitation envoyée à ${email} ?`)) {
      cancelInvitation(id);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Settings className="w-6 h-6" style={{ color: "#056cf2" }} /> Paramètres
          </h1>
          <p className="mt-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <ShieldCheck className="w-4 h-4" style={{ color: "#056cf2" }} />
            Propriétaire de {agency.name} — accès complet
          </p>
        </div>
        <Link
          href={`/agences/${agencyId}/equipe`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <Users size={14} /> Voir l&apos;équipe
        </Link>
      </motion.div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--color-success)" }}
        >
          <CheckCircle2 size={16} /> Paramètres enregistrés
        </motion.div>
      )}

      {/* SECTION 1 : Informations */}
      <Section icon={<Globe size={18} style={{ color: "#056cf2" }} />} title="Informations de l'agence">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Nom de l&apos;agence</label>
            <input
              value={agencyNameDraft}
              onChange={(e) => setAgencyNameDraft(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Créée le {agency.createdAt}</span>
            <span>·</span>
            <span>{(agency.members ?? []).length} membre{(agency.members ?? []).length > 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </Section>

      {/* SECTION 3 : Invitations */}
      <Section icon={<Mail size={18} style={{ color: "#056cf2" }} />} title="Invitations">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Définissez qui peut inviter de nouveaux membres dans cette agence.
        </p>
        <div className="space-y-2">
          {([
            { value: "owner" as const, label: "Propriétaire uniquement", desc: "Seul le créateur de l'agence peut envoyer des invitations" },
            { value: "admin" as const, label: "Propriétaire et Admins", desc: "Les admins promus peuvent aussi inviter" },
            { value: "all" as const, label: "Tous les membres", desc: "N'importe quel membre peut inviter" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateAgencySettings(agencyId, { whoCanInvite: opt.value })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80"
              style={{
                background: settings.whoCanInvite === opt.value ? "rgba(5,108,242,0.08)" : "var(--surface)",
                border: settings.whoCanInvite === opt.value ? "2px solid #056cf2" : "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.desc}</div>
              </div>
              {settings.whoCanInvite === opt.value && <CheckCircle2 size={18} style={{ color: "#056cf2" }} />}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Rôle accordé aux nouveaux membres
          </label>
          <div className="flex gap-2">
            {([
              { value: "membre" as const, label: "Membre", desc: "Aucun droit d'administration" },
              { value: "admin" as const, label: "Admin", desc: "Peut gérer utilisateurs, projets et tâches" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateAgencySettings(agencyId, { defaultMemberRole: opt.value })}
                className="flex-1 flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80"
                style={
                  settings.defaultMemberRole === opt.value
                    ? { background: "rgba(5,108,242,0.08)", border: "2px solid #056cf2" }
                    : { background: "var(--surface)", border: "1px solid var(--border-subtle)" }
                }
              >
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            S&apos;applique à chaque membre qui accepte une invitation.
          </p>
        </div>
      </Section>

      {/* SECTION : Invitations en attente */}
      <Section icon={<Clock size={18} style={{ color: "#056cf2" }} />} title="Invitations en attente">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Invitations envoyées qui n&apos;ont pas encore été acceptées ni refusées. Vous pouvez les annuler à tout moment.
        </p>

        {agencyInvitations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Aucune invitation en attente pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {agencyInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Mail size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {inv.toEmail}
                    </div>
                    <div className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} /> Envoyée par {inv.fromEmail || "un administrateur"} le {inv.createdAt}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvitation(inv.id, inv.toEmail)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--color-error)" }}
                >
                  <X size={14} /> Annuler
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* SECTION 4 : Projets et tâches */}
      <Section icon={<LayoutGrid size={18} style={{ color: "#056cf2" }} />} title="Projets et tâches">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Contrôlez qui peut créer des projets et la vue par défaut.
        </p>

        <div className="mb-6">
          <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Qui peut créer des projets
          </label>
          <div className="space-y-2">
            {([
              { value: "owner" as const, label: "Propriétaire uniquement" },
              { value: "admin" as const, label: "Propriétaire et Admins" },
              { value: "all" as const, label: "Tous les membres" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateAgencySettings(agencyId, { whoCanCreateProjects: opt.value })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80"
                style={{
                  background: settings.whoCanCreateProjects === opt.value ? "rgba(5,108,242,0.08)" : "var(--surface)",
                  border: settings.whoCanCreateProjects === opt.value ? "2px solid #056cf2" : "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</div>
                </div>
                {settings.whoCanCreateProjects === opt.value && <CheckCircle2 size={18} style={{ color: "#056cf2" }} />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Vue par défaut des tâches
          </label>
          <div className="flex gap-2">
            {([
              { value: "grid" as const, icon: <LayoutGrid size={16} />, label: "Grille" },
              { value: "list" as const, icon: <List size={16} />, label: "Liste" },
              { value: "kanban" as const, icon: <Kanban size={16} />, label: "Kanban" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateAgencySettings(agencyId, { defaultTaskView: opt.value })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                style={
                  settings.defaultTaskView === opt.value
                    ? { background: "var(--gradient-button)", color: "#fff" }
                    : { background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }
                }
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* SECTION : Notifications */}
      <Section icon={<Bell size={18} style={{ color: "#056cf2" }} />} title="Notifications">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Choisissez la façon dont cette agence vous notifie les activités importantes.
        </p>
        <button
          onClick={() => updateAgencySettings(agencyId, { emailNotifications: !settings.emailNotifications })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80"
          style={{
            background: settings.emailNotifications ? "rgba(5,108,242,0.08)" : "var(--surface)",
            border: settings.emailNotifications ? "2px solid #056cf2" : "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notifications par e-mail
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Recevoir un e-mail pour les affectations de tâches, les invitations et les changements de statut.
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
            style={
              settings.emailNotifications
                ? { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
                : { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }
            }
          >
            <Bell size={13} /> {settings.emailNotifications ? "Activées" : "Désactivées"}
          </span>
        </button>
      </Section>

      {/* SECTION 5 : Zone de danger */}
      <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: "var(--color-error)" }}>
          <AlertTriangle size={18} /> Zone de danger
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          La suppression de l&apos;agence est <strong>irréversible</strong>. Tous les membres, projets, tâches et données associées seront définitivement perdus.
        </p>
        <button
          onClick={handleDeleteAgency}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
          style={{ background: "var(--color-error)", boxShadow: "0 8px 18px -8px rgba(239,68,68,0.4)" }}
        >
          <Trash2 size={16} /> Supprimer cette agence
        </button>
      </motion.div>
    </motion.div>
  );
}
