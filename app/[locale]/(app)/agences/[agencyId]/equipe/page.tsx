"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Users, Mail, ShieldCheck, UserRound, UserPlus, Plus,
  CheckCircle2, MoreHorizontal, Trash2, ArrowLeft, Crown, Sparkles,
  Ban, UserCheck, ClipboardList, Calendar, Clock, RefreshCw, X, AlertTriangle,
  Search,
} from "lucide-react";
import {
  useAppData,
} from "@/lib/appData";
import { hexToRgba } from "@/lib/color";
import {
  hasRight, OWNER_COLOR, colorizeMembers,
  type AgencyMember, type AgencyMemberStatus, type DisplayMember, type AgencyInvitation,
} from "@/lib/types";
import {
  createInvitation, fetchAgencyInvitations, resendInvitation, cancelInvitation,
  updateAgencyMember, removeAgencyMember, loadAgencyMembers, getApiErrorMessage,
} from "@/lib/services";
import { useAuthStore } from "@/app/store/authStore";
import { formatDateLong } from "@/lib/dates";
import AvatarViewer from "@/app/[locale]/(app)/components/AvatarViewer";
import Select from "@/app/[locale]/(app)/components/Select";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const formatJoinedAt = (date: string | null, locale: string = "fr"): string | null => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return formatDateLong(d, locale);
};

const formatExpiry = (iso: string | null, locale: string = "fr"): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDateLong(d, locale);
};

const isInvitationExpired = (inv: { expiresAt: string | null }): boolean => {
  if (!inv.expiresAt) return false;
  const d = new Date(inv.expiresAt);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
};

// Le « jobtitle » est saisi par la personne dans son profil (PUT /api/me),
// puis renvoyé par l'API membres. Aucune valeur de secours ici : si le champ
// est vide, la colonne affiche un tiret « - ».

// Les clés doivent être de vraies propriétés CSS : ces objets sont
// appliqués directement via `style`. « bg » serait ignoré par React.
type Tone = { background: string; color: string; border?: string };

// Reprend exactement les styles de badge déjà présents sur la page.
const TONE_OWNER: Tone = {
  background: `linear-gradient(120deg, ${hexToRgba(OWNER_COLOR, 0.16)}, ${hexToRgba(OWNER_COLOR, 0.28)})`,
  color: "#8A6A0A",
  border: `1px solid ${hexToRgba(OWNER_COLOR, 0.4)}`,
};
const TONE_ADMIN: Tone = { background: "var(--gradient-button)", color: "#fff" };
const TONE_MEMBRE: Tone = {
  background: "var(--surface)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-subtle)",
};

const STATUT_DOT: Record<AgencyMemberStatus, string> = {
  actif: "var(--color-success)",
  en_attente: "#f59e0b",
  inactif: "var(--color-error)",
};

const FILTRES_ROLE = ["all", "admin", "membre"] as const;

type FiltreRole = (typeof FILTRES_ROLE)[number];

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
  const t = useTranslations("Team");
  const tc = useTranslations("Common");

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
            {t("modals.inviteConfirm.title")}
          </h2>
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t.rich("modals.inviteConfirm.text", {
            agency: agencyName,
            strong: (chunks) => (
              <strong style={{ color: "var(--text-primary)" }}>{chunks}</strong>
            ),
          })}
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
            {tc("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)" }}
          >
            <UserPlus size={15} /> {tc("confirm")}
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
  const tc = useTranslations("Common");
  const toneBg =
    tone === "danger"
      ? "var(--color-error)"
      : tone === "success"
        ? "var(--color-success)"
        : "var(--gradient-button)";
  const toneShadow =
    tone === "danger"
      ? "0 8px 18px -8px rgba(239,68,68,0.4)"
      : "0 8px 18px -8px rgba(var(--blue-rgb),0.4)";
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
            {tc("cancel")}
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
  const t = useTranslations("Team");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [flipUp, setFlipUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setMenuPos(null);
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const up = openUp || spaceBelow < 300;
      setFlipUp(up);
      const height = panelRef.current?.offsetHeight ?? 240;
      if (up) {
        setMenuPos({ top: Math.max(8, rect.top - height + 8), right: window.innerWidth - rect.right });
      } else {
        setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
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
          background: open ? "rgba(var(--blue-rgb),0.14)" : "var(--surface)",
          border: "1px solid",
          borderColor: open ? "var(--blue)" : "var(--border-subtle)",
          color: open ? "var(--blue)" : "var(--text-secondary)",
          boxShadow: "0 4px 12px -6px rgba(10,27,60,0.3)",
        }}
        title={t("menu.actions")}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: flipUp ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              top: menuPos.top,
              right: menuPos.right,
              background: "var(--chrome-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 18px 44px -18px rgba(10,27,60,0.4)",
            }}
            className={`fixed z-50 w-60 rounded-2xl p-2 ${panelClassName ?? ""}`}
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
              onClick={() => { close(); onChangeRole(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: "var(--text-primary)" }}
            >
              <ShieldCheck size={15} style={{ color: "var(--blue)" }} />
              {member.role === "admin" ? t("menu.demote") : t("menu.promote")}
            </button>
            {member.status !== "en_attente" && (
              <button
                onClick={() => { close(); onToggleStatus(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
                style={{ color: member.status === "inactif" ? "var(--color-success)" : "var(--color-error)" }}
              >
                {member.status === "inactif" ? <UserCheck size={15} /> : <Ban size={15} />}
                {member.status === "inactif" ? t("menu.reactivate") : t("menu.deactivate")}
              </button>
            )}
            <div className="my-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
            <button
              onClick={() => { close(); onRemove(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: "var(--color-error)" }}
            >
              <Trash2 size={15} /> {tc("delete")}
            </button>
          </motion.div>
        </>,
        document.body,
      )}
    </div>
  );
}

export default function EquipePage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const locale = useLocale();
  const tc = useTranslations("Common");
  const te = useTranslations("Errors");
  const tTeam = useTranslations("Team");
  const tn = useTranslations("Navigation.app");
  const { data, reload, tasksByAgency, setAgencyMembers } = useAppData();
  const agency = data.agencies.find((a) => a.id === Number(agencyId));
  const user = useAuthStore((s) => s.user);

  // Balise <strong> réutilisée dans les messages riches (t.rich)
  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  const [viewerMail, setViewerMail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [inviteFocused, setInviteFocused] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "membre">("membre");
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingForcedRemoval, setPendingForcedRemoval] = useState<{
    member: AgencyMember;
    message: string;
  } | null>(null);
  const [invitations, setInvitations] = useState<AgencyInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [cancelInvitationTarget, setCancelInvitationTarget] = useState<AgencyInvitation | null>(null);
  const [busyInvitationId, setBusyInvitationId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<FiltreRole>("all");

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

  useEffect(() => {
    if (data.lastLoadedAt === null) return;
    if (Date.now() - data.lastLoadedAt > 30000) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.lastLoadedAt]);

  const agencyTasks = useMemo(() => tasksByAgency(agencyId), [tasksByAgency, agencyId]);

  // Compte des tâches assignées par e-mail, calculé une seule fois (O(T)) au
  // lieu d'un filtre O(M×T) refait pour chaque membre à chaque rendu.
  const taskCountByEmail = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of agencyTasks) {
      const email = (t.assigneeEmail ?? "").toLowerCase();
      if (!email) continue;
      counts.set(email, (counts.get(email) ?? 0) + 1);
    }
    return counts;
  }, [agencyTasks]);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tc("loading")}</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{te("agencyNotFound")}</p>
        <p style={{ color: "var(--text-secondary)" }}>
          {te("agencyNotFoundDetail")}
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> {tn("myAgencies")}
        </Link>
      </div>
    );
  }

  const people = colorizeMembers(agency.members ?? [], agency.ownerId);
  const isOwnerMember = (m: AgencyMember) =>
    m.user.id === agency.ownerId;
  const accentOf = (m: DisplayMember): string =>
    isOwnerMember(m) ? OWNER_COLOR : m.color;

  const canInvite = hasRight(agency, user?.email ?? "", "invite");
  const canManageUsers = hasRight(agency, user?.email ?? "", "manageUsers");

  type PendingAction =
    | { type: "changeRole"; member: AgencyMember }
    | { type: "toggleStatus"; member: AgencyMember }
    | { type: "remove"; member: AgencyMember };

  const requestChangeRole = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert(tTeam("errors.cannotChangeOwnRole")); return; }
    setPendingAction({ type: "changeRole", member: m });
  };

  const requestToggleStatus = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert(tTeam("errors.cannotChangeOwnStatus")); return; }
    setPendingAction({ type: "toggleStatus", member: m });
  };

  const requestRemove = (m: AgencyMember) => {
    if (m.user.id === user?.id) { alert(tTeam("errors.cannotRemoveSelf")); return; }
    setPendingAction({ type: "remove", member: m });
  };

  // ---------- Vue membre : poste métier ≠ rôle système ----------
  // Le rôle affiché est celui du BADGE, donc le propriétaire est une
  // catégorie à part : il ne doit apparaître que dans « Tous ».
  const roleAffiche = (m: AgencyMember): "proprietaire" | "admin" | "membre" =>
    isOwnerMember(m) ? "proprietaire" : m.role;

  const posteDe = (m: AgencyMember): string | null =>
    (m.user.jobTitle ?? "").trim() || null;

  const compteRole = (key: FiltreRole): number =>
    key === "all"
      ? people.length
      : people.filter((m) => roleAffiche(m) === key).length;

  // ---------- Recherche + filtre ----------
  const q = search.trim().toLowerCase();
  const visiblePeople = people.filter((m) => {
    if (roleFilter !== "all" && roleAffiche(m) !== roleFilter) return false;
    if (!q) return true;
    return [m.user.name, m.user.firstName, m.user.lastName, m.user.email].some((v) =>
      (v ?? "").toLowerCase().includes(q),
    );
  });

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const { type, member } = pendingAction;
    const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;
    setPendingAction(null);

    const snapshot = agency?.members ?? [];
    const reconcile = () =>
      void loadAgencyMembers(agencyId)
        .then((members) => setAgencyMembers(agencyId, members))
        .catch(() => {});

    try {
      if (type === "changeRole") {
        const newRole = member.role === "admin" ? "membre" : "admin";
        // UI optimiste : le rôle change immédiatement, l'API travaille en fond.
        setAgencyMembers(
          agencyId,
          snapshot.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)),
        );
        setActionSuccess(
          tTeam("success.roleChanged", {
            name: fullName,
            role: tTeam(`roleShort.${newRole}`),
          }),
        );
        await updateAgencyMember(agencyId, member.id, { role: newRole });
        reconcile();
      } else if (type === "toggleStatus") {
        const newStatus = member.status === "inactif" ? "actif" : "inactif";
        setAgencyMembers(
          agencyId,
          snapshot.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m)),
        );
        setActionSuccess(
          newStatus === "actif"
            ? tTeam("success.accountReactivated", { name: fullName })
            : tTeam("success.accountDeactivated", { name: fullName }),
        );
        await updateAgencyMember(agencyId, member.id, { status: newStatus });
        reconcile();
      } else {
        // Retrait optimiste : le membre disparaît immédiatement.
        setAgencyMembers(
          agencyId,
          snapshot.filter((m) => m.id !== member.id),
        );
        try {
          await removeAgencyMember(agencyId, member.id);
          setActionSuccess(tTeam("success.memberRemoved", { name: fullName }));
          reconcile();
        } catch (err) {
          const axiosErr = err as {
            response?: { status?: number; data?: { message?: string; requires_confirmation?: boolean } };
          };
          if (
            axiosErr?.response?.status === 409 &&
            axiosErr?.response?.data?.requires_confirmation
          ) {
            setAgencyMembers(agencyId, snapshot);
            setPendingForcedRemoval({
              member,
              message: axiosErr.response.data.message ?? tTeam("errors.forcedDefault"),
            });
            return;
          }
          throw err;
        }
      }
    } catch (err) {
      setAgencyMembers(agencyId, snapshot);
      setActionSuccess(null);
      alert(getApiErrorMessage(err));
    }

    setTimeout(() => setActionSuccess(null), 3000);
  };

  const viewerMember = people.find((m) => m.user.email === viewerMail);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed === (user?.email ?? "").toLowerCase()) {
      alert(tTeam("errors.cannotInviteSelf"));
      return;
    }
    const already = (agency.members ?? []).some(
      (m) => (m.user.email ?? "").toLowerCase() === trimmed,
    );
    if (already) {
      setInviteError(tTeam("errors.alreadyExists", { email: trimmed }));
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
    const inviteEmail = confirmEmail;
    setConfirmEmail(null);
    setInviteError(null);
    try {
      await createInvitation(agencyId, { email: inviteEmail, role: inviteRole });
      setEmail("");
      setInviteSuccess(inviteEmail);
      setTimeout(() => setInviteSuccess(null), 5000);
      void reload();
      void refreshInvitations();
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    }
  };

  const cancelSendInvitation = () => setConfirmEmail(null);

  const handleResendInvitation = async (inv: AgencyInvitation) => {
    setBusyInvitationId(inv.id);
    setInviteError(null);
    try {
      const updated = await resendInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
      setActionSuccess(tTeam("success.reminderSent", { email: inv.email }));
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    } finally {
      setBusyInvitationId(null);
    }
  };

  const requestCancelInvitation = (inv: AgencyInvitation) => {
    setCancelInvitationTarget(inv);
  };

  const confirmCancelInvitation = async (inv: AgencyInvitation) => {
    setCancelInvitationTarget(null);
    setBusyInvitationId(inv.id);
    setInviteError(null);
    try {
      await cancelInvitation(agencyId, inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      setActionSuccess(tTeam("success.invitationCancelled", { email: inv.email }));
      setTimeout(() => setActionSuccess(null), 3000);
      void reload();
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
      setTimeout(() => setInviteError(null), 4000);
    } finally {
      setBusyInvitationId(null);
    }
  };

  return (
    <motion.div variants={container} initial={false} animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
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
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {tTeam("title")}
            </h1>
            <p className="mt-0.5 text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              {tTeam.rich("subtitle", {
                count: people.length,
                name: agency.name,
                num: (chunks) => (
                  <span className="font-bold" style={{ color: "var(--blue)" }}>{chunks}</span>
                ),
                agency: (chunks) => (
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {chunks}
                  </span>
                ),
              })}
              <Sparkles size={13} className="ml-0.5" style={{ color: "var(--blue)", opacity: 0.6 }} />
            </p>
          </div>
        </div>

      </motion.div>

      <motion.p
        variants={item}
        className="-mt-3 text-lg  tracking-tight"
        style={{ color: "var(--text-secondary)" }}
      >
        {tTeam("tagline")}
      </motion.p>

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
                <span className="font-semibold">{tTeam("invite.sent", { email: inviteSuccess })}</span>{" "}
                {tTeam("invite.sentDetail", { agency: agency.name })}
              </p>
            </div>
            <button
              onClick={() => setInviteSuccess(null)}
              aria-label={tc("close")}
              className="shrink-0 self-start rounded-lg p-1 transition-opacity hover:opacity-70"
              style={{ color: "var(--color-success)" }}
            >
              <X size={16} />
            </button>
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
            style={{ background: "var(--accent-soft)", color: "var(--blue)" }}
          >
            <Users size={26} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {tTeam("alone.title")}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {tTeam("alone.text")}
          </p>
        </motion.div>
      )}

  <motion.div
        variants={item}
        className="glass rounded-2xl overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* ---------- Recherche + filtres ---------- */}
        <div className="px-5 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <label htmlFor="equipe-recherche" className="sr-only">
              {tTeam("search.label")}
            </label>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="equipe-recherche"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tTeam("search.placeholder")}
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto lg:ml-auto">
            {FILTRES_ROLE.map((key) => {
              const actif = roleFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRoleFilter(key)}
                  aria-pressed={actif}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-80"
                  style={{
                    background: actif ? "var(--gradient-button)" : "var(--surface)",
                    color: actif ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${actif ? "transparent" : "var(--border-subtle)"}`,
                  }}
                >
                  {tTeam(`filters.${key}`)}
                  <span className="opacity-80">{compteRole(key)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------- Tableau des membres ---------- */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <caption className="sr-only">
              {tTeam("table.caption")}
            </caption>
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                {(
                  ["member", "jobTitle", "role", "tasks", "status", "actions"] as const
                ).map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-left text-[11px] font-bold uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tTeam(`table.columns.${h}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePeople.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Search
                      size={22}
                      className="mx-auto mb-3"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {tTeam("table.noResults")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setRoleFilter("all");
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--blue)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <RefreshCw size={12} /> {tTeam("table.resetFilters")}
                    </button>
                  </td>
                </tr>
              ) : (
                visiblePeople.map((m) => {
                  const role = roleAffiche(m);
                  const poste = posteDe(m);
                  const dot = STATUT_DOT[m.status];
                  const joined = formatJoinedAt(m.joinedAt, locale);
                  return (
                    <tr
                      key={m.user.id}
                      className="transition-colors hover:bg-[color:var(--surface)]"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      {/* Membre */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              m.user.avatar ? setViewerMail(m.user.email) : undefined
                            }
                            disabled={!m.user.avatar}
                            aria-label={
                              m.user.avatar
                                ? tTeam("table.viewPhoto", {
                                    name: `${m.user.firstName} ${m.user.lastName}`,
                                  })
                                : undefined
                            }
                            className="relative w-10 h-10 rounded-full p-[2px] shrink-0 disabled:cursor-default"
                            style={{
                              background:
                                m.status === "inactif"
                                  ? "var(--border-subtle)"
                                  : isOwnerMember(m)
                                    ? "var(--gradient-button)"
                                    : accentOf(m),
                            }}
                          >
                            <span
                              className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                              style={{ background: "var(--card-bg)" }}
                            >
                              {m.user.avatar ? (
                                <img
                                  src={m.user.avatar}
                                  alt=""
                                  width={40}
                                  height={40}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserRound
                                  className="w-5 h-5"
                                  style={{
                                    color:
                                      m.status === "inactif"
                                        ? "var(--text-muted)"
                                        : accentOf(m),
                                  }}
                                />
                              )}
                            </span>
                            {isOwnerMember(m) && (
                              <span
                                className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                                style={{
                                  width: 18,
                                  height: 18,
                                  background: OWNER_COLOR,
                                  border: "2px solid var(--card-bg)",
                                }}
                              >
                                <Crown size={9} className="text-white" />
                              </span>
                            )}
                          </button>
                          <div className="min-w-0">
                            <div
                              className="font-bold truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {m.user.firstName} {m.user.lastName}
                            </div>
                            <div
                              className="text-xs truncate flex items-center gap-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Mail size={10} /> {m.user.email}
                            </div>
                            {joined && (
                              <div
                                className="text-[11px] truncate flex items-center gap-1 mt-0.5"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <Calendar size={10} /> {tTeam("table.since", { date: joined })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Poste / métier */}
                      <td className="px-4 py-3">
                        <span
                          className="text-sm"
                          style={{ color: poste ? "var(--text-secondary)" : "var(--text-muted)" }}
                        >
                          {poste ?? "-"}
                        </span>
                      </td>

                      {/* Rôle système */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                          style={
                            role === "proprietaire"
                              ? TONE_OWNER
                              : role === "admin"
                                ? {
                                    ...TONE_ADMIN,
                                    boxShadow: "0 4px 10px -5px rgba(var(--blue-rgb),0.45)",
                                  }
                                : TONE_MEMBRE
                          }
                        >
                          {role === "proprietaire" ? (
                            <Crown size={11} />
                          ) : (
                            <ShieldCheck size={11} />
                          )}
                          {tTeam(`roles.${role}`)}
                        </span>
                      </td>

                      {/* Tâches assignées */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <ClipboardList
                            size={13}
                            style={{ color: "var(--text-muted)" }}
                          />
                          {taskCountByEmail.get((m.user.email ?? "").toLowerCase()) ?? 0}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                          style={{ color: dot }}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: dot }}
                          />
                          {tTeam(`status.${m.status}`)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {canManageUsers && !isOwnerMember(m) ? (
                          <MemberMenu
                            member={m}
                            onChangeRole={() => requestChangeRole(m)}
                            onToggleStatus={() => requestToggleStatus(m)}
                            onRemove={() => requestRemove(m)}
                          />
                        ) : (
                          <span className="inline-block w-9" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {canManageUsers && (invitationsLoading ? (
        <motion.div
          variants={item}
          className="glass rounded-2xl p-5 flex items-center gap-3"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{tTeam("loadingInvitations")}</span>
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
            <Clock size={13} /> {tTeam("invitations.pending")}
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
                          {tTeam(`roleShort.${inv.role}`)}
                        </span>
                        {expired ? (
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                            <X size={11} /> {tTeam("invitations.expired")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />{" "}
                            {tTeam("invitations.expiresOn", { date: formatExpiry(inv.expiresAt, locale) })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResendInvitation(inv)}
                        disabled={busyInvitationId === inv.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: "rgba(var(--blue-rgb),0.08)", border: "1px solid rgba(var(--blue-rgb),0.25)", color: "var(--blue)" }}
                      >
                        <RefreshCw size={13} /> {tTeam("invitations.resend")}
                      </button>
                      <button
                        onClick={() => requestCancelInvitation(inv)}
                        disabled={busyInvitationId === inv.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--color-error)" }}
                      >
                        <X size={13} /> {tc("cancel")}
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
            boxShadow: inviteFocused ? "0 16px 40px -16px rgba(var(--blue-rgb),0.35)" : "var(--shadow-card)",
            borderStyle: inviteFocused ? "solid" : "dashed",
            borderWidth: "1.5px",
            borderColor: inviteFocused ? "var(--blue)" : "var(--border-subtle)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: "var(--accent-soft)", color: "var(--blue)" }}
          >
            <UserPlus size={13} /> {tTeam("invite.badge")}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setInviteFocused(true)}
              onBlur={() => setInviteFocused(false)}
              placeholder={tTeam("invite.emailPlaceholder")}
              type="email"
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
              style={{
                background: inviteFocused ? "var(--card-bg)" : "var(--input-bg)",
                border: `1px solid ${inviteFocused ? "var(--blue)" : "var(--input-border)"}`,
                boxShadow: inviteFocused ? "0 0 0 4px rgba(var(--blue-rgb),0.12)" : "none",
                color: "var(--text-primary)",
              }}
            />
            <Select
              value={inviteRole}
              onChange={(v) => setInviteRole(v as "admin" | "membre")}
              options={[
                { value: "membre", label: tTeam("roleShort.membre") },
                { value: "admin", label: tTeam("roleShort.admin") },
              ]}
              className="rounded-xl"
            />
            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shrink-0"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)" }}
            >
              <Plus size={16} /> {tTeam("invite.submit")}
            </motion.button>
          </div>
        </motion.form>
      )}

      {pendingAction && (() => {
        const { type, member } = pendingAction;
        const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;

        if (type === "changeRole") {
          const isPromote = member.role === "membre";
          const k = isPromote ? "modals.promote" : "modals.demote";
          return (
            <ConfirmActionModal
              icon={<ShieldCheck size={20} />}
              title={tTeam(`${k}.title`)}
              description={tTeam.rich(`${k}.description`, { name: fullName, strong })}
              confirmLabel={tTeam(`${k}.confirm`)}
              tone="primary"
              onConfirm={confirmPendingAction}
              onCancel={() => setPendingAction(null)}
            />
          );
        }

        if (type === "toggleStatus") {
          const isDeactivate = member.status !== "inactif";
          const k = isDeactivate ? "modals.deactivate" : "modals.reactivate";
          return (
            <ConfirmActionModal
              icon={isDeactivate ? <Ban size={20} /> : <UserCheck size={20} />}
              tone={isDeactivate ? "danger" : "success"}
              title={tTeam(`${k}.title`)}
              description={tTeam.rich(`${k}.description`, { name: fullName, strong })}
              confirmLabel={tTeam(`${k}.confirm`)}
              onConfirm={confirmPendingAction}
              onCancel={() => setPendingAction(null)}
            />
          );
        }

        return (
          <ConfirmActionModal
            icon={<Trash2 size={20} />}
            tone="danger"
            title={tTeam("modals.remove.title")}
            description={tTeam.rich("modals.remove.description", { name: fullName, strong })}
            confirmLabel={tc("delete")}
            onConfirm={confirmPendingAction}
            onCancel={() => setPendingAction(null)}
          />
        );
      })()}

      {pendingForcedRemoval && (() => {
        const { member, message } = pendingForcedRemoval;
        const fullName = `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.email;
        const confirmForcedRemoval = async () => {
          setPendingForcedRemoval(null);
          const snapshot = agency?.members ?? [];
          setAgencyMembers(
            agencyId,
            snapshot.filter((m) => m.id !== member.id),
          );
          try {
            await removeAgencyMember(agencyId, member.id, true);
            setActionSuccess(tTeam("success.memberRemoved", { name: fullName }));
            void loadAgencyMembers(agencyId)
              .then((members) => setAgencyMembers(agencyId, members))
              .catch(() => {});
          } catch (err) {
            setAgencyMembers(agencyId, snapshot);
            setActionSuccess(null);
            alert(getApiErrorMessage(err));
          }
          setTimeout(() => setActionSuccess(null), 3000);
        };
        return (
          <ConfirmActionModal
            icon={<Trash2 size={20} />}
            tone="danger"
            title={tTeam("modals.forced.title")}
            description={
              <>
                {message}
                <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {tTeam.rich("modals.forced.warning", {
                    danger: (chunks) => (
                      <strong style={{ color: "var(--color-error)" }}>{chunks}</strong>
                    ),
                  })}
                </div>
              </>
            }
            confirmLabel={tTeam("modals.forced.confirm")}
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

      {cancelInvitationTarget && (
        <ConfirmActionModal
          icon={<X size={20} />}
          tone="danger"
          title={tTeam("modals.cancelInvitation.title")}
          description={tTeam.rich("modals.cancelInvitation.description", {
            email: cancelInvitationTarget.email,
            strong,
          })}
          confirmLabel={tTeam("modals.cancelInvitation.confirm")}
          onConfirm={() => confirmCancelInvitation(cancelInvitationTarget)}
          onCancel={() => setCancelInvitationTarget(null)}
        />
      )}
    </motion.div>
  );
}