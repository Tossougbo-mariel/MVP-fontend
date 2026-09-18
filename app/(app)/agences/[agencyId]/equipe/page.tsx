"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Users, Mail, ShieldCheck, UserRound, UserPlus, Plus,
  Settings, CheckCircle2, MoreHorizontal, Trash2, ArrowLeft, Crown, Sparkles,
  Ban, UserCheck, ClipboardList, Copy, Calendar, Clock, RefreshCw, X, AlertTriangle,
} from "lucide-react";
import {
  useAppData,
} from "@/lib/appData";
import {
  userRoleInAgency, hasRight, OWNER_COLOR, colorizeMembers,
  type AgencyMember, type DisplayMember, type AgencyInvitation,
} from "@/lib/types";
import {
  createInvitation, fetchAgencyInvitations, resendInvitation, cancelInvitation,
  updateAgencyMember, removeAgencyMember, getApiErrorMessage,
} from "@/lib/services";
import { useAuthStore } from "@/app/store/authStore";
import AvatarViewer from "@/app/(app)/components/AvatarViewer";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const hexToRgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${(n & 255)},${alpha})`;
};

const formatJoinedAt = (date: string | null): string | null => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const formatExpiry = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const isInvitationExpired = (inv: { expiresAt: string | null }): boolean => {
  if (!inv.expiresAt) return false;
  const d = new Date(inv.expiresAt);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};

function InviteConfirmModal({
  email,
  agencyName,
  onConfirm,
  onCancel,
}: {
  email: string | null;
  agencyName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!email) return null;

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
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Confirmer l&apos;invitation
          </h2>
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Envoyer une invitation à rejoindre{" "}
          <strong style={{ color: "var(--text-primary)" }}>{agencyName}</strong>{" "}
          à l&apos;adresse :
        </p>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
        >
          <Mail size={14} /> {email}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            <UserPlus size={15} /> Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmActionModal({
  icon,
  title,
  description,
  confirmLabel,
  tone = "primary",
  onConfirm,
  onCancel,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "success" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const toneBg =
    tone === "danger"
      ? "var(--color-error)"
      : tone === "success"
        ? "var(--color-success)"
        : "var(--gradient-button)";
  const toneShadow =
    tone === "danger"
      ? "0 8px 18px -8px rgba(239,68,68,0.4)"
      : "0 8px 18px -8px rgba(37,99,235,0.4)";
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
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={
              tone === "danger"
                ? { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }
                : tone === "success"
                  ? { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
                  : { background: "var(--gradient-primary)", color: "#fff" }
            }
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: toneBg, boxShadow: toneShadow }}
          >
            <CheckCircle2 size={15} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberMenu({
  member,
  openUp = false,
  className,
  buttonClassName,
  panelClassName,
  onChangeRole,
  onToggleStatus,
  onRemove,
}: {
  member: AgencyMember;
  openUp?: boolean;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setFlipUp(openUp || spaceBelow < 300);
    }
    setOpen(!open);
  };
  return (
    <div className={`${className ?? "relative"} shrink-0`}>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-9 h-9 rounded-full inline-flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${buttonClassName ?? ""}`}
        style={{
          background: open ? "rgba(5,108,242,0.14)" : "var(--surface)",
          border: "1px solid",
          borderColor: open ? "#056cf2" : "var(--border-subtle)",
          color: open ? "#056cf2" : "var(--text-secondary)",
          boxShadow: "0 4px 12px -6px rgba(10,27,60,0.3)",
        }}
        title="Actions de gestion"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: flipUp ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={panelClassName ?? `absolute right-0 ${flipUp ? "bottom-11" : "top-11"} z-30 w-60 rounded-2xl p-2`}
            style={{ background: "var(--chrome-card)", border: "1px solid var(--border-subtle)", boxShadow: "0 18px 44px -18px rgba(10,27,60,0.4)" }}
          >
            <div
              className="px-3 py-2 mb-1 rounded-lg"
              style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {member.user.firstName} {member.user.lastName}
              </div>
              <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {member.user.email}
              </div>
            </div>
            <button
              onClick={() => { setOpen(false); onChangeRole(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: "var(--text-primary)" }}
            >
              <ShieldCheck size={15} style={{ color: "#056cf2" }} />
              {member.role === "admin" ? "Rétrograder en Membre" : "Promouvoir en Admin"}
            </button>
            {member.status !== "en_attente" && (
              <button
                onClick={() => { setOpen(false); onToggleStatus(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: member.status === "inactif" ? "var(--color-success)" : "var(--color-error)" }}
              >
                {member.status === "inactif" ? <UserCheck size={15} /> : <Ban size={15} />}
                {member.status === "inactif" ? "Réactiver le compte" : "Désactiver le compte"}
              </button>
            )}
            <div className="my-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
            <button
              onClick={() => { setOpen(false); onRemove(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: "var(--color-error)" }}
            >
              <Trash2 size={15} /> Supprimer
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function EquipePage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const { data, reload, tasksByAgency } = useAppData();
  const agency = data.agencies.find((a) => a.id === Number(agencyId));
  const user = useAuthStore((s) => s.user);

  const [viewerMail, setViewerMail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [inviteFocused, setInviteFocused] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "membre">("membre");
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<AgencyInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [busyInvitationId, setBusyInvitationId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchAgencyInvitations(agencyId);
        if (alive) setInvitations(list);
      } catch {
        // silencieux : la section n'apparaît tout simplement pas
      } finally {
        if (alive) setInvitationsLoading(false);
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
        <p style={{ color: "var(--text-secondary)" }}>
          Cette agence n&apos;existe pas ou vous n&apos;en faites pas partie.
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

  const people = colorizeMembers(agency.members ?? [], agency.ownerId);
  const isOwnerMember = (m: AgencyMember) =>
    m.user.id === agency.ownerId;
  const accentOf = (m: DisplayMember): string =>
    isOwnerMember(m) ? OWNER_COLOR : m.color;
  const myRole = user ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = myRole === "owner" || myRole === "admin";

  const canInvite = hasRight(agency, user?.email ?? "", "invite");
  const canManageUsers = hasRight(agency, user?.email ?? "", "manageUsers");

  type PendingAction =
    | { type: "changeRole"; member: AgencyMember }
    | { type: "toggleStatus"; member: AgencyMember }
    | { type: "remove"; member: AgencyMember };

  const requestChangeRole = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert("Vous ne pouvez pas modifier votre propre rôle."); return; }
    setPendingAction({ type: "changeRole", member: m });
  };

  const requestToggleStatus = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert("Vous ne pouvez pas modifier votre propre statut."); return; }
    setPendingAction({ type: "toggleStatus", member: m });
  };

  const requestRemove = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert("Vous ne pouvez pas supprimer votre propre compte."); return; }
    setPendingAction({ type: "remove", member: m });
  };

  const agencyTasks = tasksByAgency(agencyId);
  const taskCountFor = (m: AgencyMember) => {
    const email = (m.user.email ?? "").toLowerCase();
    return agencyTasks.filter((t) => (t.assigneeEmail ?? "").toLowerCase() === email).length;
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const { type, member } = pendingAction;
    const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;

    try {
      if (type === "changeRole") {
        const newRole = member.role === "admin" ? "membre" : "admin";
        await updateAgencyMember(agencyId, member.id, { role: newRole });
        await reload();
        setActionSuccess(`« ${fullName} » est désormais ${newRole === "admin" ? "Admin" : "Membre"}.`);
      } else if (type === "toggleStatus") {
        const newStatus = member.status === "inactif" ? "actif" : "inactif";
        await updateAgencyMember(agencyId, member.id, { status: newStatus });
        await reload();
        setActionSuccess(
          newStatus === "actif"
            ? `Le compte de « ${fullName} » a été réactivé.`
            : `Le compte de « ${fullName} » a été désactivé.`,
        );
      } else {
        try {
          await removeAgencyMember(agencyId, member.id);
          await reload();
          setActionSuccess(`« ${fullName} » a été supprimé(e) de l'agence.`);
        } catch (err) {
          const axiosErr = err as {
            response?: { status?: number; data?: { message?: string; requires_confirmation?: boolean } };
          };
          if (
            axiosErr?.response?.status === 409 &&
            axiosErr?.response?.data?.requires_confirmation
          ) {
            setPendingAction(null);
            setPendingForcedRemoval({
              member,
              message: axiosErr.response.data.message ?? "Ce membre a des tâches en cours dans les projets de l'agence.",
            });
            return;
          }
          throw err;
        }
      }
    } catch (err) {
      setActionSuccess(null);
      alert(getApiErrorMessage(err));
    }

    setPendingAction(null);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const viewerMember = people.find((m) => m.user.email === viewerMail);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === (user?.email ?? "").toLowerCase()) {
      alert("Vous ne pouvez pas vous inviter vous-même.");
      return;
    }
    const already = (agency.members ?? []).some(
      (m) => (m.user.email ?? "").toLowerCase() === trimmed,
    );
    if (already) {
      setInviteError(`Une invitation ou un membre existe déjà pour ${trimmed}.`);
      setTimeout(() => setInviteError(null), 4000);
      return;
    }
    setConfirmEmail(trimmed);
  };

  const refreshInvitations = async () => {
    try {
      const list = await fetchAgencyInvitations(agencyId);
      setInvitations(list);
    } catch {
      // silencieux
    }
  };

  const confirmSendInvitation = async () => {
    if (!confirmEmail) return;
    setInviteError(null);
    try {
      const created = await createInvitation(agencyId, { email: confirmEmail, role: inviteRole });
      await reload();
      await refreshInvitations();
      setEmail("");
      setInviteSuccess(confirmEmail);
      setInviteLink(`${window.location.origin}/accepter-invitation?token=${created.token}`);
      setTimeout(() => {
        setInviteSuccess(null);
        setInviteLink(null);
        setInviteCopied(false);
      }, 8000);
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    }
    setConfirmEmail(null);
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      window.prompt("Copiez le lien d'invitation :", inviteLink);
    }
  };

  const cancelSendInvitation = () => setConfirmEmail(null);

  const handleResendInvitation = async (inv: AgencyInvitation) => {
    setBusyInvitationId(inv.id);
    setInviteError(null);
    try {
      const updated = await resendInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
      setActionSuccess(`Rappel envoyé à ${inv.email}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    } finally {
      setBusyInvitationId(null);
    }
  };

  const handleCancelInvitation = async (inv: AgencyInvitation) => {
    if (!window.confirm(`Annuler l'invitation envoyée à ${inv.email} ?`)) return;
    setBusyInvitationId(inv.id);
    setInviteError(null);
    try {
      await cancelInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      await reload();
      setActionSuccess(`Invitation de ${inv.email} annulée.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    } finally {
      setBusyInvitationId(null);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              width: 52,
              height: 52,
              background: "var(--gradient-primary)",
              boxShadow: "0 10px 26px -8px rgba(5,108,242,0.55)",
            }}
          >
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Équipe
            </h1>
            <p className="mt-0.5 text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <span className="font-bold" style={{ color: "#056cf2" }}>{people.length}</span>
              membre{people.length > 1 ? "s" : ""} dans
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {agency.name}
              </span>
              <Sparkles size={13} className="ml-0.5" style={{ color: "#056cf2", opacity: 0.6 }} />
            </p>
          </div>
        </div>

      </motion.div>

      <AnimatePresence>
        {inviteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl px-5 py-4 flex items-center gap-3 overflow-hidden"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.35)",
              color: "var(--color-success)",
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">Invitation envoyée à {inviteSuccess}.</span>{" "}
                Un e-mail lui a été envoyé pour rejoindre {agency.name}.
              </p>
              {inviteLink && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                  <code
                    className="flex-1 truncate rounded-lg px-3 py-2 text-xs"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyInviteLink}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0"
                    style={{ background: "var(--gradient-button)", color: "#fff" }}
                  >
                    {inviteCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {inviteCopied ? "Lien copié" : "Copier le lien"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inviteError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl px-5 py-4 flex items-center gap-3 overflow-hidden"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "var(--color-error)",
            }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{inviteError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-2xl px-5 py-4 flex items-center gap-3 overflow-hidden"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.35)",
              color: "var(--color-success)",
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{actionSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {people.length <= 1 && (
        <motion.div variants={item} className="glass rounded-3xl p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: "var(--accent-soft)", color: "#056cf2" }}
          >
            <Users size={26} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Vous êtes le seul agent pour le moment
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Invitez des membres de l&apos;équipe pour commencer à collaborer.
          </p>
        </motion.div>
      )}

  <div className="space-y-3">
    {people.map((m) => (
      <motion.div
        key={m.user.id}
        variants={item}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="glass relative rounded-2xl pl-7 pr-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
        style={{
          boxShadow: isOwnerMember(m) ? `0 10px 26px -12px ${hexToRgba(OWNER_COLOR, 0.4)}` : "var(--shadow-card)",
          border: isOwnerMember(m) ? `1px solid ${hexToRgba(OWNER_COLOR, 0.28)}` : undefined,
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{
            background:
              m.status === "inactif"
                ? "var(--border-subtle)"
                : isOwnerMember(m)
                  ? "linear-gradient(180deg, #056cf2, " + OWNER_COLOR + ")"
                  : accentOf(m),
          }}
        />

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className="w-11 h-11 rounded-full p-[2px]"
              style={{
                background:
                  m.status === "inactif"
                    ? "var(--border-subtle)"
                    : isOwnerMember(m)
                      ? "linear-gradient(145deg, #056cf2, #0a2a6b)"
                      : accentOf(m),
                boxShadow: m.status !== "inactif" ? `0 6px 14px -6px ${hexToRgba(accentOf(m), 0.4)}` : "none",
              }}
              onClick={m.user.avatar ? () => setViewerMail(m.user.email) : undefined}
              title={m.user.avatar ? "Voir la photo de profil" : undefined}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "var(--card-bg)" }}
              >
                {m.user.avatar ? (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${m.user.avatar})` }} />
                ) : (
                  <UserRound className="w-6 h-6" style={{ color: m.status === "inactif" ? "var(--text-muted)" : accentOf(m) }} />
                )}
              </div>
            </div>
            {isOwnerMember(m) && (
              <span
                className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center"
                style={{ width: 18, height: 18, background: OWNER_COLOR, border: "2px solid var(--card-bg)" }}
              >
                <Crown size={9} className="text-white" />
              </span>
            )}
            {m.status === "actif" && !isOwnerMember(m) && (
              <span className="absolute bottom-0 right-0 flex h-3 w-3">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: "var(--color-success)" }}
                />
                <span
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ background: "var(--color-success)", border: "2px solid var(--card-bg)" }}
                />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
              {m.user.firstName} {m.user.lastName}
            </div>
            <div className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Mail size={10} /> {m.user.email}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span className="inline-flex items-center gap-1">
                <ClipboardList size={10} /> {taskCountFor(m)} tâche{taskCountFor(m) > 1 ? "s" : ""}
              </span>
              {formatJoinedAt(m.joinedAt) && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={10} /> Membre depuis le {formatJoinedAt(m.joinedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isOwnerMember(m) && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full"
              style={{
                background: `linear-gradient(120deg, ${hexToRgba(OWNER_COLOR, 0.16)}, ${hexToRgba(OWNER_COLOR, 0.28)})`,
                color: "#8A6A0A",
                border: `1px solid ${hexToRgba(OWNER_COLOR, 0.4)}`,
              }}
            >
              <Crown size={11} /> Propriétaire
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full"
            style={
              m.role === "admin"
                ? { background: "var(--gradient-button)", color: "#fff", boxShadow: "0 4px 10px -5px rgba(37,99,235,0.45)" }
                : { background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }
            }
          >
            <ShieldCheck size={11} />
            {m.role === "admin" ? "Admin" : "Membre"}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full"
            style={
              m.status === "inactif"
                ? { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }
                : m.status === "en_attente"
                  ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                  : { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
            }
          >
            <CheckCircle2 size={11} />
            {m.status === "inactif" ? "Inactif" : m.status === "en_attente" ? "En attente" : "Actif"}
          </span>
        </div>

        {canManageUsers && !isOwnerMember(m) ? (
          <MemberMenu
            member={m}
            onChangeRole={() => requestChangeRole(m)}
            onToggleStatus={() => requestToggleStatus(m)}
            onRemove={() => requestRemove(m)}
          />
        ) : (
          <span className="w-9" />
        )}
      </motion.div>
    ))}
  </div>

      {canManageUsers && (invitationsLoading ? (
        <motion.div
          variants={item}
          className="glass rounded-2xl p-5 flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement des invitations...</span>
        </motion.div>
      ) : (invitations.filter((i) => i.status === "en_attente").length > 0 ? (
        <motion.div
          variants={item}
          className="glass rounded-3xl p-6 md:p-7"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
          >
            <Clock size={13} /> Invitations en attente
          </div>
          <div className="space-y-3">
            {invitations
              .filter((i) => i.status === "en_attente")
              .map((inv) => {
                const expired = isInvitationExpired(inv);
                return (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {inv.email}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: "var(--text-muted)" }}>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck size={11} />
                          {inv.role === "admin" ? "Admin" : "Membre"}
                        </span>
                        {expired ? (
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                            <X size={11} /> Expirée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> Expire le {formatExpiry(inv.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResendInvitation(inv)}
                        disabled={busyInvitationId === inv.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
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
                        <X size={13} /> Annuler
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      ) : null))}

      {canInvite && (
        <motion.form
          variants={item}
          onSubmit={handleInvite}
          className="glass relative rounded-3xl p-6 md:p-7 transition-all duration-300"
          style={{
            boxShadow: inviteFocused ? "0 16px 40px -16px rgba(5,108,242,0.35)" : "var(--shadow-card)",
            borderStyle: inviteFocused ? "solid" : "dashed",
            borderWidth: "1.5px",
            borderColor: inviteFocused ? "#056cf2" : "var(--border-subtle)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: "var(--accent-soft)", color: "#056cf2" }}
          >
            <UserPlus size={13} /> Inviter un agent
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setInviteFocused(true)}
              onBlur={() => setInviteFocused(false)}
              placeholder="Email de l'agent à inviter"
              type="email"
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: inviteFocused ? "var(--card-bg)" : "var(--input-bg)",
                border: `1px solid ${inviteFocused ? "#056cf2" : "var(--input-border)"}`,
                boxShadow: inviteFocused ? "0 0 0 4px rgba(5,108,242,0.12)" : "none",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "membre")}
              className="rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="membre">Membre</option>
              <option value="admin">Admin</option>
            </select>
            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shrink-0"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
            >
              <Plus size={16} /> Inviter
            </motion.button>
          </div>
        </motion.form>
      )}

      {!canInvite && isAdmin && (
        <motion.div
          variants={item}
          className="glass rounded-2xl p-4 flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-soft)" }}
          >
            <Settings size={15} style={{ color: "#056cf2" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Seul le propriétaire peut inviter des membres.{" "}
            <Link href={`/agences/${agencyId}/parametres`} className="font-semibold" style={{ color: "#056cf2" }}>
              Modifier ce réglage
            </Link>
          </p>
        </motion.div>
      )}

      {pendingAction && (() => {
        const { type, member } = pendingAction;
        const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;

        if (type === "changeRole") {
          const isPromote = member.role === "membre";
          return (
            <ConfirmActionModal
              icon={<ShieldCheck size={20} />}
              title={isPromote ? "Promouvoir ce membre" : "Rétrograder ce membre"}
              description={
                <>
                  Confirmer la {isPromote ? "promotion" : "rétrogradation"} de{" "}
                  <strong>{fullName}</strong> en tant que {isPromote ? "Admin" : "Membre"} ?
                  {!isPromote && " Il perdra ses droits d'administration."}
                </>
              }
              confirmLabel={isPromote ? "Promouvoir" : "Rétrograder"}
              tone="primary"
              onConfirm={confirmPendingAction}
              onCancel={() => setPendingAction(null)}
            />
          );
        }

        if (type === "toggleStatus") {
          const isDeactivate = member.status !== "inactif";
          return (
            <ConfirmActionModal
              icon={isDeactivate ? <Ban size={20} /> : <UserCheck size={20} />}
              tone={isDeactivate ? "danger" : "success"}
              title={isDeactivate ? "Désactiver ce compte" : "Réactiver ce compte"}
              description={
                isDeactivate ? (
                  <>
                    Désactiver le compte de <strong>{fullName}</strong> ? Ce membre ne pourra plus recevoir de
                    nouvelles tâches.
                  </>
                ) : (
                  <>
                    Réactiver le compte de <strong>{fullName}</strong> ? Il pourra de nouveau recevoir des tâches.
                  </>
                )
              }
              confirmLabel={isDeactivate ? "Désactiver" : "Réactiver"}
              onConfirm={confirmPendingAction}
              onCancel={() => setPendingAction(null)}
            />
          );
        }

        return (
          <ConfirmActionModal
            icon={<Trash2 size={20} />}
            tone="danger"
            title="Supprimer ce membre"
            description={
              <>
                Supprimer <strong>{fullName}</strong> de l&apos;agence ? Cette action est{" "}
                <strong>irréversible</strong>.
              </>
            }
            confirmLabel="Supprimer"
            onConfirm={confirmPendingAction}
            onCancel={() => setPendingAction(null)}
          />
        );
      })()}

      {pendingForcedRemoval && (() => {
        const { member, message } = pendingForcedRemoval;
        const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;
        const confirmForcedRemoval = async () => {
          try {
            await removeAgencyMember(agencyId, member.id, true);
            await reload();
            setActionSuccess(`« ${fullName} » a été supprimé(e) de l'agence.`);
          } catch (err) {
            setActionSuccess(null);
            alert(getApiErrorMessage(err));
          }
          setPendingForcedRemoval(null);
          setTimeout(() => setActionSuccess(null), 3000);
        };
        return (
          <ConfirmActionModal
            icon={<Trash2 size={20} />}
            tone="danger"
            title="Retirer ce membre&nbsp;?"
            description={
              <>
                {message}
                <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  Si vous continuez, ce membre sera supprimé de l&apos;agence et de{" "}
                  <strong style={{ color: "var(--color-error)" }}>tous les projets</strong> auxquels il
                  appartient.
                </div>
              </>
            }
            confirmLabel="Retirer quand même"
            onConfirm={confirmForcedRemoval}
            onCancel={() => setPendingForcedRemoval(null)}
          />
        );
      })()}

      <AvatarViewer
        open={!!viewerMember}
        src={viewerMember?.user.avatar}
        onClose={() => setViewerMail(null)}
      />

      <InviteConfirmModal
        email={confirmEmail}
        agencyName={agency.name}
        onConfirm={confirmSendInvitation}
        onCancel={cancelSendInvitation}
      />
    </motion.div>
  );
}
