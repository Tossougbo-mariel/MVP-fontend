"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck, ArrowLeft, Settings, Users, Trash2, CheckCircle2, Save, Pencil,
  AlertTriangle, Globe, Mail, X, Clock, LayoutGrid, List, Kanban, RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  isAgencyOwner,
  type AgencyInvitation,
  type AgencySettings,
  DEFAULT_AGENCY_SETTINGS,
} from "@/lib/types";
import {
  updateAgency, deleteAgency,
  fetchAgencyInvitations, resendInvitation, cancelInvitation,
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
  const { data, reload } = useAppData();
  const agency = data.agencies.find((a) => a.id === Number(agencyId));

  // ====== États (toujours déclarés AVANT tout retour anticipé) ======
  const [agencyNameDraft, setAgencyNameDraft] = useState(agency?.name ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(agency?.description ?? "");
  const [editingInfo, setEditingInfo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState<number | null>(null);
  const [invitations, setInvitations] = useState<AgencyInvitation[]>([]);
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
    })();
    return () => {
      alive = false;
    };
  }, [agencyId]);

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

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await updateAgency(agencyId, {
        name: agencyNameDraft.trim() || agency.name,
        description: descriptionDraft.trim() || null,
      });
      await reload();
      setEditingInfo(false);
      flashSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cancelEditingInfo = () => {
    setAgencyNameDraft(agency?.name ?? "");
    setDescriptionDraft(agency?.description ?? "");
    setEditingInfo(false);
  };

  const openEditingInfo = () => {
    setAgencyNameDraft(agency?.name ?? "");
    setDescriptionDraft(agency?.description ?? "");
    setEditingInfo(true);
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
    setDeleting(true);
    setError(null);
    try {
      await deleteAgency(agencyId);
      await reload();
      router.push("/mes-agences");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDeleting(false);
      setConfirmDeleteOpen(false);
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
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              width: 52,
              height: 52,
              background: "var(--gradient-primary)",
              boxShadow: "0 10px 26px -8px rgba(var(--blue-rgb),0.55)",
            }}
          >
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Paramètres
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--blue)" }} />
              Propriétaire de {agency.name} — accès complet
            </p>
          </div>
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
      <Section icon={<Globe size={18} style={{ color: "var(--blue)" }} />} title="Informations de l'agence">
        {!editingInfo ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Nom de l&apos;agence</label>
              <p className="w-full rounded-xl px-4 py-3 text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                {agency.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Description</label>
              <p className="w-full rounded-xl px-4 py-3 text-sm whitespace-pre-wrap" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}>
                {agency.description || "—"}
              </p>
            </div>
            <button
              onClick={openEditingInfo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)" }}
            >
              <Pencil size={16} /> Modifier
            </button>
          </div>
        ) : (
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
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Description</label>
              <textarea
                value={descriptionDraft ?? ""}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)" }}
              >
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={cancelEditingInfo}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* SECTION 2 : Invitations */}
      <Section icon={<Mail size={18} style={{ color: "var(--blue)" }} />} title="Invitations">
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
              onClick={() => saveSettings({ whoCanInvite: opt.value })}
              disabled={settingsSaving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80 disabled:opacity-60"
              style={{
                background: settings.whoCanInvite === opt.value ? "rgba(var(--blue-rgb),0.08)" : "var(--surface)",
                border: settings.whoCanInvite === opt.value ? "2px solid var(--blue)" : "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{opt.desc}</div>
              </div>
              {settings.whoCanInvite === opt.value && <CheckCircle2 size={18} style={{ color: "var(--blue)" }} />}
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
                onClick={() => saveSettings({ defaultMemberRole: opt.value })}
                disabled={settingsSaving}
                className="flex-1 flex flex-col items-start gap-1 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80 disabled:opacity-60"
                style={
                  settings.defaultMemberRole === opt.value
                    ? { background: "rgba(var(--blue-rgb),0.08)", border: "2px solid var(--blue)" }
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

      {/* SECTION 3 : Invitations en attente */}
      <Section icon={<Clock size={18} style={{ color: "var(--blue)" }} />} title="Invitations en attente">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Invitations envoyées qui n&apos;ont pas encore été acceptées ni refusées. Vous pouvez les annuler à tout moment.
        </p>

        {pendingInvitations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Aucune invitation en attente pour le moment.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingInvitations.map((inv) => {
              const expired = isInvitationExpired(inv);
              return (
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
                        {inv.email}
                      </div>
                      <div className="text-xs truncate flex items-center gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck size={10} /> {inv.role === "admin" ? "Admin" : "Membre"}
                        </span>
                        {expired ? (
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                            <X size={10} /> Expirée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={10} /> Expire le{" "}
                            {inv.expiresAt
                              ? new Date(inv.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                              : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResendInvitation(inv)}
                      disabled={busyInvitationId === inv.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                      style={{ background: "rgba(var(--blue-rgb),0.08)", border: "1px solid rgba(var(--blue-rgb),0.25)", color: "var(--blue)" }}
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
      <Section icon={<LayoutGrid size={18} style={{ color: "var(--blue)" }} />} title="Projets et tâches">
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
                onClick={() => saveSettings({ whoCanCreateProjects: opt.value })}
                disabled={settingsSaving}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{
                  background: settings.whoCanCreateProjects === opt.value ? "rgba(var(--blue-rgb),0.08)" : "var(--surface)",
                  border: settings.whoCanCreateProjects === opt.value ? "2px solid var(--blue)" : "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</div>
                </div>
                {settings.whoCanCreateProjects === opt.value && <CheckCircle2 size={18} style={{ color: "var(--blue)" }} />}
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
                onClick={() => saveSettings({ defaultTaskView: opt.value })}
                disabled={settingsSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
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

      {/* SECTION 5 : Zone de danger */}
      <motion.div variants={item} className="glass rounded-2xl p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: "var(--color-error)" }}>
          <AlertTriangle size={18} /> Zone de danger
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          La suppression de l&apos;agence est <strong>irréversible</strong>. Tous les membres, projets, tâches et données associées seront définitivement perdus.
        </p>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
          style={{ background: "var(--color-error)", boxShadow: "0 8px 18px -8px rgba(239,68,68,0.4)" }}
        >
          <Trash2 size={16} /> {deleting ? "Suppression..." : "Supprimer cette agence"}
        </button>
      </motion.div>
    </motion.div>

    {confirmDeleteOpen && (
      <DeleteAgencyModal
        agencyName={agency.name}
        deleting={deleting}
        onConfirm={handleDeleteAgency}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    )}
    </>
  );
}

function DeleteAgencyModal({
  agencyName,
  deleting,
  onConfirm,
  onCancel,
}: {
  agencyName: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }}>
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Supprimer l&apos;agence ?
          </h2>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Vous êtes sur le point de supprimer définitivement <strong>{agencyName}</strong>. Cette action ne peut pas être annulée.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--color-error)", boxShadow: "0 8px 18px -8px rgba(239,68,68,0.4)" }}
          >
            <Trash2 size={15} /> {deleting ? "Suppression..." : "Supprimer définitivement"}
          </button>
        </div>
      </div>
    </div>
  );
}
