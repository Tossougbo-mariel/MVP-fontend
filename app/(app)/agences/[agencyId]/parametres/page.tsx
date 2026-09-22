"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Settings, Users, Users2, Trash2, CheckCircle2, Save,
  AlertTriangle, Globe, Mail, X, Clock, LayoutGrid, List, Kanban, Bell, RefreshCw,
  Pencil, Lock, Check, UserRoundPlus, Plus,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  isAgencyOwner,
  type AgencyInvitation,
  type AgencySettings,
  type AgencyPermission,
  type AgencyTeam,
  DEFAULT_AGENCY_SETTINGS,
} from "@/lib/types";
import {
  updateAgency, deleteAgency,
  fetchAgencyInvitations, resendInvitation, cancelInvitation,
  fetchAgencyTeams,
  getApiErrorMessage,
} from "@/lib/services";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const isInvitationExpired = (inv: { expiresAt: string | null }): boolean => {
  if (!inv.expiresAt) return false;
  const d = new Date(inv.expiresAt);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};

const PERMISSION_OPTIONS: { value: AgencyPermission; label: string }[] = [
  { value: "owner", label: "Propriétaire seul" },
  { value: "admin", label: "Propriétaire + Admins" },
  { value: "all", label: "Tous les membres" },
];

const PERMISSION_DESCRIPTIONS: Record<AgencyPermission, string> = {
  owner: "Seul le propriétaire de l'agence peut effectuer cette action.",
  admin: "Le propriétaire et les admins peuvent effectuer cette action.",
  all: "Tout membre actif de l'agence peut effectuer cette action.",
};

const ROLE_CELLS: { key: AgencyPermission; label: string }[] = [
  { key: "owner", label: "Propriétaire" },
  { key: "admin", label: "Admin" },
  { key: "all", label: "Membre" },
];

const INCLUDED_ROLES: Record<AgencyPermission, AgencyPermission[]> = {
  owner: ["owner"],
  admin: ["owner", "admin"],
  all: ["owner", "admin", "all"],
};

function Section({
  icon,
  title,
  actions,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          {icon} {title}
        </h2>
        {actions}
      </div>
      {children}
    </motion.div>
  );
}

function PermissionRow({
  icon,
  title,
  value,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: AgencyPermission;
  onChange: (v: AgencyPermission) => void;
  disabled?: boolean;
}) {
  const included = INCLUDED_ROLES[value];
  return (
    <div className="rounded-2xl p-4 md:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)" }}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{PERMISSION_DESCRIPTIONS[value]}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PERMISSION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
              style={
                value === opt.value
                  ? { background: "var(--gradient-button)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.45)" }
                  : { background: "var(--hover-soft)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {ROLE_CELLS.map((cell) => {
          const granted = included.includes(cell.key);
          return (
            <div
              key={cell.key}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
              style={{
                background: granted ? "rgba(16,185,129,0.10)" : "var(--hover-soft)",
                color: granted ? "var(--color-success)" : "var(--text-muted)",
                border: granted ? "1px solid rgba(16,185,129,0.35)" : "1px solid transparent",
              }}
            >
              {granted ? <Check size={13} /> : <X size={13} />}
              {cell.label}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
        <Lock size={12} style={{ color: "#C7961A" }} /> Le propriétaire dispose toujours de cette permission.
      </p>
    </div>
  );
}

export default function ParametresPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, reload } = useAppData();
  const agency = data.agencies.find((a) => a.id === Number(agencyId));

  // ====== États (toujours déclarés AVANT tout retour anticipé) ======
  const [agencyNameDraft, setAgencyNameDraft] = useState(agency?.name ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(agency?.description ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState<number | null>(null);
  const [invitations, setInvitations] = useState<AgencyInvitation[]>([]);
  const [teams, setTeams] = useState<AgencyTeam[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchAgencyInvitations(agencyId);
        if (alive) setInvitations(list);
      } catch {
        // silencieux
      }
      try {
        const list = await fetchAgencyTeams(agencyId);
        if (alive) setTeams(list);
      } catch {
        // silencieux
      }
    })();
    return () => {
      alive = false;
    };
  }, [agencyId]);

  if (data.loading && data.lastLoadedAt === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

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

  if (!user || !isAgencyOwner(agency, user.email)) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center justify-center gap-6 min-h-[50vh] text-center">
        <motion.div variants={item} className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
          <ShieldCheck className="w-8 h-8" style={{ color: "var(--color-error)" }} />
        </motion.div>
        <motion.div variants={item}>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Seul le propriétaire peut gérer les paramètres</p>
          <p className="mt-2 max-w-md" style={{ color: "var(--text-secondary)" }}>
            Vous devez être propriétaire de {agency.name} pour modifier ces réglages.
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

  const settings: AgencySettings = agency.settings ?? DEFAULT_AGENCY_SETTINGS;

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const startEditInfo = () => {
    setAgencyNameDraft(agency?.name ?? "");
    setDescriptionDraft(agency?.description ?? "");
    setEditingInfo(true);
  };

  const cancelEditInfo = () => {
    setAgencyNameDraft(agency?.name ?? "");
    setDescriptionDraft(agency?.description ?? "");
    setEditingInfo(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateAgency(agencyId, {
        name: agencyNameDraft.trim() || agency.name,
        description: descriptionDraft.trim() || null,
      });
      await reload();
      flashSaved();
      setEditingInfo(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (patch: Partial<AgencySettings>) => {
    setError(null);
    setSettingsSaving(true);
    try {
      await updateAgency(agencyId, { settings: { ...settings, ...patch } });
      await reload();
      flashSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteAgency = async () => {
    if (window.confirm(`Supprimer définitivement "${agency.name}" ? Tous les membres, projets et données seront perdus.`)) {
      if (window.confirm("Dernière chance : êtes-vous sûr ?")) {
        setDeleting(true);
        setError(null);
        try {
          await deleteAgency(agencyId);
          await reload();
          router.push("/mes-agences");
        } catch (err) {
          setError(getApiErrorMessage(err));
          setDeleting(false);
        }
      }
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === "en_attente");

  const handleResendInvitation = async (inv: AgencyInvitation) => {
    setBusyInvitationId(inv.id);
    setError(null);
    try {
      const updated = await resendInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyInvitationId(null);
    }
  };

  const handleCancelInvitation = async (inv: AgencyInvitation) => {
    if (!window.confirm(`Annuler l'invitation envoyée à ${inv.email} ?`)) return;
    setBusyInvitationId(inv.id);
    setError(null);
    try {
      await cancelInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyInvitationId(null);
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

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-error)" }}
        >
          <AlertTriangle size={16} /> {error}
        </motion.div>
      )}

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
      <Section
        icon={<Globe size={18} style={{ color: "#056cf2" }} />}
        title="Informations de l'agence"
        actions={
          editingInfo ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }}
            >
              <Pencil size={12} /> Édition en cours…
            </span>
          ) : (
            <button
              onClick={startEditInfo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-transform hover:scale-105"
              style={{ background: "rgba(5,108,242,0.08)", border: "1px solid rgba(5,108,242,0.25)", color: "#056cf2" }}
            >
              <Pencil size={14} /> Modifier
            </button>
          )
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Nom de l&apos;agence</label>
            <input
              value={agencyNameDraft}
              onChange={(e) => setAgencyNameDraft(e.target.value)}
              readOnly={!editingInfo}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
                opacity: editingInfo ? 1 : 0.55,
                cursor: editingInfo ? "text" : "default",
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Description</label>
            <textarea
              value={descriptionDraft ?? ""}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              readOnly={!editingInfo}
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
                opacity: editingInfo ? 1 : 0.55,
                cursor: editingInfo ? "text" : "default",
              }}
            />
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Créée le {agency.createdAt}</span>
            <span>·</span>
            <span>{(agency.members ?? []).length} membre{(agency.members ?? []).length > 1 ? "s" : ""}</span>
          </div>
          {editingInfo ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
              <button
                onClick={cancelEditInfo}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                <X size={16} /> Annuler
              </button>
            </div>
          ) : (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Lock size={12} /> Informations verrouillées — cliquez sur « Modifier » pour les modifier.
            </p>
          )}
        </div>
      </Section>

      {/* SECTION 2 : Invitations & permissions */}
      <Section icon={<UserRoundPlus size={18} style={{ color: "#056cf2" }} />} title="Invitations & permissions">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Choisissez qui, parmi les membres de l&apos;agence, est autorisé à inviter de nouveaux membres.
        </p>

        <div className="space-y-3">
          <PermissionRow
            icon={<UserRoundPlus size={18} style={{ color: "#056cf2" }} />}
            title="Inviter des membres"
            value={settings.whoCanInvite}
            onChange={(v) => saveSettings({ whoCanInvite: v })}
            disabled={settingsSaving}
          />
        </div>

        <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Rôle accordé aux nouveaux membres
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {([
              { value: "membre" as const, label: "Membre", desc: "Aucun droit d'administration", icon: <Users size={15} style={{ color: "#056cf2" }} /> },
              { value: "admin" as const, label: "Admin", desc: "Peut gérer utilisateurs, projets et tâches", icon: <ShieldCheck size={15} style={{ color: "#C7961A" }} /> },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveSettings({ defaultMemberRole: opt.value })}
                disabled={settingsSaving}
                className="flex-1 flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80 disabled:opacity-60"
                style={
                  settings.defaultMemberRole === opt.value
                    ? { background: "rgba(5,108,242,0.08)", border: "2px solid #056cf2" }
                    : { background: "var(--surface)", border: "1px solid var(--border-subtle)" }
                }
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--hover-soft)" }}>{opt.icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            S&apos;applique à chaque membre qui accepte une invitation.
          </p>
        </div>
      </Section>

      {/* SECTION 3 : Invitations en attente */}
      <Section
        icon={<Clock size={18} style={{ color: "#056cf2" }} />}
        title="Invitations en attente"
        actions={
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wide"
            style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}
          >
            {pendingInvitations.length} en attente
          </span>
        }
      >
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Invitations envoyées qui n&apos;ont pas encore été acceptées ni refusées. Vous pouvez les relancer ou les annuler à tout moment.
        </p>

        {pendingInvitations.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--accent-soft)" }}>
              <Mail size={22} style={{ color: "var(--accent-text)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Aucune invitation en attente
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Les invitations envoyées apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((inv) => {
              const expired = isInvitationExpired(inv);
              const msLeft = inv.expiresAt ? new Date(inv.expiresAt).getTime() - Date.now() : 0;
              const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;
              return (
                <div
                  key={inv.id}
                  className="flex flex-col xl:flex-row xl:items-center gap-4 px-4 py-4 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                      <Mail size={17} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {inv.email}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: inv.role === "admin" ? "rgba(199,150,26,0.12)" : "rgba(5,108,242,0.08)",
                            color: inv.role === "admin" ? "#C7961A" : "#056cf2",
                          }}
                        >
                          {inv.role === "admin" ? <ShieldCheck size={10} /> : <Users size={10} />}
                          {inv.role === "admin" ? "Admin" : "Membre"}
                        </span>
                        {expired ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }}
                          >
                            <X size={10} /> Expirée
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#b45309" }}
                          >
                            <Clock size={10} />
                            {daysLeft > 0 ? `Expire dans ${daysLeft} j` : "Expire aujourd'hui"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResendInvitation(inv)}
                      disabled={busyInvitationId === inv.id || expired}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                      style={{ background: "rgba(5,108,242,0.08)", border: "1px solid rgba(5,108,242,0.25)", color: "#056cf2" }}
                    >
                      <RefreshCw size={13} /> Relancer
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(inv)}
                      disabled={busyInvitationId === inv.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--color-error)" }}
                    >
                      <X size={14} /> {busyInvitationId === inv.id ? "Annulation..." : "Annuler"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* SECTION 4 : Projets et tâches */}
      <Section icon={<LayoutGrid size={18} style={{ color: "#056cf2" }} />} title="Projets et tâches">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Contrôlez qui peut créer des projets et la vue dans laquelle ils s&apos;ouvrent par défaut.
        </p>

        <PermissionRow
          icon={<Plus size={18} style={{ color: "#056cf2" }} />}
          title="Créer des projets"
          value={settings.whoCanCreateProjects}
          onChange={(v) => saveSettings({ whoCanCreateProjects: v })}
          disabled={settingsSaving}
        />

        <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
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
                onClick={() => saveSettings({ defaultTaskView: opt.value })}
                disabled={settingsSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                style={
                  settings.defaultTaskView === opt.value
                    ? { background: "var(--gradient-button)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.45)" }
                    : { background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }
                }
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Les projets s&apos;ouvriront sur cette vue. Le Kanban reste accessible depuis chaque projet.
          </p>
        </div>
      </Section>

      {/* SECTION 4b : Équipes & adhésions */}
      <Section icon={<Users2 size={18} style={{ color: "#056cf2" }} />} title="Équipes & adhésions">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Regroupez vos collaborateurs en équipes et contrôlez qui peut les créer et les gérer.
        </p>

        <PermissionRow
          icon={<Users2 size={18} style={{ color: "#056cf2" }} />}
          title="Créer et gérer les équipes"
          value={settings.whoCanManageTeams}
          onChange={(v) => saveSettings({ whoCanManageTeams: v })}
          disabled={settingsSaving}
        />

        <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
            Adhésion par défaut des équipes
          </label>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "fermee" as const, icon: <Lock size={16} />, label: "Fermée (sur invitation)" },
              { value: "ouverte" as const, icon: <Users2 size={16} />, label: "Ouverte (tout membre rejoint)" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => saveSettings({ defaultTeamMembership: opt.value })}
                disabled={settingsSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                style={
                  settings.defaultTeamMembership === opt.value
                    ? { background: "var(--gradient-button)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.45)" }
                    : { background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }
                }
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Chaque équipe pourra tout de même choisir son adhésion individuellement.
          </p>
        </div>

        <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Équipes de l&apos;agence
            </span>
            <Link href={`/agences/${agencyId}/equipe`} className="text-xs font-semibold hover:opacity-80" style={{ color: "#056cf2" }}>
              Gérer sur la page Équipe
            </Link>
          </div>
          {teams.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Aucune équipe pour le moment. Créez vos premières équipes depuis la page Équipe.
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <Users2 size={16} style={{ color: "#056cf2" }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {t.name}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: t.membership === "ouverte" ? "rgba(245,158,11,0.12)" : "rgba(5,108,242,0.08)",
                      color: t.membership === "ouverte" ? "#f59e0b" : "#056cf2",
                    }}
                  >
                    {t.membership === "ouverte" ? "Ouverte" : "Fermée"}
                  </span>
                  <span className="text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
                    {t.memberCount} membre{t.memberCount > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* SECTION 5 : Notifications */}
      <Section icon={<Bell size={18} style={{ color: "#056cf2" }} />} title="Notifications">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Choisissez la façon dont cette agence vous notifie les activités importantes.
        </p>
        <button
          onClick={() => saveSettings({ emailNotifications: !settings.emailNotifications })}
          disabled={settingsSaving}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 rounded-2xl text-left transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: settings.emailNotifications ? "rgba(16,185,129,0.12)" : "var(--hover-soft)" }}
            >
              <Mail size={18} style={{ color: settings.emailNotifications ? "var(--color-success)" : "var(--text-muted)" }} />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                Notifications par e-mail
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{
                    background: settings.emailNotifications ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    color: settings.emailNotifications ? "var(--color-success)" : "var(--color-error)",
                  }}
                >
                  {settings.emailNotifications ? "Activées" : "Désactivées"}
                </span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Affectations de tâches, invitations et changements de statut par e-mail.
              </div>
            </div>
          </div>
          <span
            className="relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors"
            style={{ background: settings.emailNotifications ? "var(--gradient-button)" : "var(--border-subtle)" }}
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
              style={{ left: settings.emailNotifications ? 24 : 4 }}
            />
          </span>
        </button>
      </Section>

      {/* SECTION 6 : Zone de danger */}
      <motion.div
        variants={item}
        className="rounded-2xl p-6 md:p-8"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-error)" }}>
            <AlertTriangle size={18} /> Zone de danger
          </h2>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
            style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }}
          >
            Irréversible
          </span>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          La suppression de l&apos;agence est <strong>irréversible</strong>. Tous les membres, projets, tâches et données associées seront définitivement perdus.
        </p>
        <button
          onClick={handleDeleteAgency}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
          style={{ background: "var(--color-error)", boxShadow: "0 8px 18px -8px rgba(239,68,68,0.4)" }}
        >
          <Trash2 size={16} /> {deleting ? "Suppression..." : "Supprimer cette agence"}
        </button>
      </motion.div>
    </motion.div>
  );
}
