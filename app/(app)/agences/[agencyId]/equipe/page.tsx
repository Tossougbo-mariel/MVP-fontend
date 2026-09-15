"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Users, Mail, ShieldCheck, UserRound, UserPlus, Plus,
  LayoutGrid, List, Settings, CheckCircle2, MoreHorizontal, Ban, Trash2, ClipboardList, ArrowLeft, Crown, Sparkles,
} from "lucide-react";
import {
  useAgencyStore, userRoleInAgency, hasRight, type AgencyMember, MEMBER_COLORS, OWNER_COLOR,
} from "@/app/store/agencyStore";
import { useAuthStore } from "@/app/store/authStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";
import { useRegisteredUsersStore } from "@/app/store/registeredUsersStore";
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
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};
const memberColor = (m: { color?: string } | null | undefined) =>
  m?.color ?? MEMBER_COLORS[0];

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
                {member.firstName} {member.lastName}
              </div>
              <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                {member.email}
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
            <button
              onClick={() => { setOpen(false); onToggleStatus(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: member.status === "inactif" ? "var(--color-success)" : "var(--color-error)" }}
            >
              <Ban size={15} />
              {member.status === "inactif" ? "Réactiver le compte" : "Désactiver le compte"}
            </button>
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
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));
  const user = useAuthStore((s) => s.user);
  const sendInvitation = useNotificationsStore((s) => s.sendInvitation);
  const userExists = useRegisteredUsersStore((s) => s.userExists);
  const updateMember = useAgencyStore((s) => s.updateMember);
  const removeMember = useAgencyStore((s) => s.removeMember);

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

  const members = (agency?.members ?? []).filter(
    (m) => m.email.toLowerCase() !== (agency?.createdBy ?? "").toLowerCase()
  );
  const owner = (agency?.members ?? []).find(
    (m) => m.email.toLowerCase() === (agency?.createdBy ?? "").toLowerCase()
  ) ?? null;
  // ✅ Le propriétaire est affiché comme n'importe quel membre, avec son badge.
  const people = owner ? [owner, ...members] : members;
  const isOwnerMember = (m: { email: string }) =>
    m.email.toLowerCase() === (agency?.createdBy ?? "").toLowerCase();
  // ✅ Le propriétaire a une couleur dédiée (rouge sombre), distincte des membres.
  const accentOf = (m: { email: string; color?: string }): string =>
    isOwnerMember(m) ? OWNER_COLOR : memberColor(m);
  const myRole = user && agency ? userRoleInAgency(agency, user.email) : "membre";
const isAdmin = myRole === "owner" || myRole === "admin";

  const canInvite = hasRight(agency ?? null, user?.email ?? "", "invite");
  const canManageUsers = hasRight(agency ?? null, user?.email ?? "", "manageUsers");

type PendingAction =
  | { type: "changeRole"; member: AgencyMember }
  | { type: "toggleStatus"; member: AgencyMember }
  | { type: "remove"; member: AgencyMember };

const requestChangeRole = (m: AgencyMember) => {
  if (m.email === user?.email) { alert("Vous ne pouvez pas modifier votre propre rôle."); return; }
  setPendingAction({ type: "changeRole", member: m });
};

const requestToggleStatus = (m: AgencyMember) => {
  if (m.email === user?.email) { alert("Vous ne pouvez pas désactiver votre propre compte."); return; }
  setPendingAction({ type: "toggleStatus", member: m });
};

const requestRemove = (m: AgencyMember) => {
  if (m.email === user?.email) { alert("Vous ne pouvez pas supprimer votre propre compte."); return; }
  setPendingAction({ type: "remove", member: m });
};

const confirmPendingAction = () => {
  if (!pendingAction) return;
  const { type, member } = pendingAction;
  const fullName = `${member.firstName} ${member.lastName}`.trim() || member.email;

  if (type === "changeRole") {
    const newRole = member.role === "admin" ? "membre" : "admin";
    updateMember(agencyId, member.email, { role: newRole });
    setActionSuccess(`« ${fullName} » est désormais ${newRole === "admin" ? "Admin" : "Membre"}.`);
  } else if (type === "toggleStatus") {
    const newStatus = member.status === "inactif" ? "actif" : "inactif";
    updateMember(agencyId, member.email, { status: newStatus });
    setActionSuccess(`Le compte de « ${fullName} » a été ${newStatus === "actif" ? "réactivé" : "désactivé"}.`);
  } else {
    removeMember(agencyId, member.email);
    setActionSuccess(`« ${fullName} » a été supprimé(e) de l'agence.`);
  }

  setPendingAction(null);
  setTimeout(() => setActionSuccess(null), 3000);
};

  // ✅ Vue par défaut : grille pour les petites équipes (≤ 8), liste pour les grandes
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    members.length + (owner ? 1 : 0) <= 8 ? "grid" : "list",
  );
  const [viewerMail, setViewerMail] = useState<string | null>(null);
  const viewerMember = people.find((m) => m.email === viewerMail);

const [email, setEmail] = useState("");
const [inviteFocused, setInviteFocused] = useState(false);
const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!agencyId || !trimmed) return;

    if (!userExists(trimmed)) {
      alert("Aucun compte enregistré avec cet email. L'utilisateur doit d'abord créer un compte.");
      return;
    }
    if (trimmed === user?.email.toLowerCase()) {
      alert("Vous ne pouvez pas vous inviter vous-même.");
      return;
    }
    setConfirmEmail(trimmed);
  };

  const confirmSendInvitation = () => {
    if (!agencyId || !confirmEmail) return;
    const invitation = sendInvitation({
      agencyId,
      agencyName: agency?.name ?? "Agence",
      toEmail: confirmEmail,
      fromEmail: user?.email ?? "",
    });
    if (invitation) {
      setEmail("");
      setInviteSuccess(confirmEmail);
      setTimeout(() => setInviteSuccess(null), 4000);
    } else {
      alert("Une invitation active existe déjà pour cet email.");
    }
    setConfirmEmail(null);
  };

  const cancelSendInvitation = () => setConfirmEmail(null);

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
                {agency?.name ?? "cette agence"}
              </span>
              <Sparkles size={13} className="ml-0.5" style={{ color: "#056cf2", opacity: 0.6 }} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="relative inline-flex items-center rounded-2xl p-1 gap-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 6px 18px -10px rgba(10,27,60,0.25)" }}
          >
            {([
              { mode: "grid" as const, label: "Cartes", icon: <LayoutGrid size={14} /> },
              { mode: "list" as const, label: "Liste", icon: <List size={14} /> },
            ]).map((tab) => {
              const active = viewMode === tab.mode;
              return (
                <button
                  key={tab.mode}
                  onClick={() => setViewMode(tab.mode)}
                  className={`relative inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 ${
                    active ? "text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="memberViewPill"
                      className="absolute inset-0 z-0 rounded-xl"
                      style={{ background: "var(--gradient-button)", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.5)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-[1] inline-flex items-center gap-1.5">
                    {tab.icon} {tab.label}
                  </span>
                </button>
              );
            })}
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
            <p className="text-sm">
              <span className="font-semibold">Invitation envoyée à {inviteSuccess}.</span>{" "}
              Un e-mail avec un lien d&apos;acceptation lui a été envoyé · la notification apparaît aussi dans ses notifications.
            </p>
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

      {members.length === 0 && (
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

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {people.map((m) => (
            <motion.div
              key={m.email}
              variants={item}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="glass relative rounded-3xl p-6 pt-7 flex flex-col items-center gap-3"
              style={{
                boxShadow: isOwnerMember(m)
                  ? `0 14px 32px -12px ${hexToRgba(OWNER_COLOR, 0.35)}`
                  : "var(--shadow-card)",
                border: isOwnerMember(m) ? `1px solid ${hexToRgba(OWNER_COLOR, 0.3)}` : undefined,
              }}
            >
              {isOwnerMember(m) && (
                <span
                  className="absolute inset-x-3 top-0 h-1.5 rounded-t-3xl"
                  style={{ background: "linear-gradient(90deg, #056cf2, " + OWNER_COLOR + ")" }}
                />
              )}
              {canManageUsers && !isOwnerMember(m) && (
                <MemberMenu
                  className="absolute inset-0 z-20 pointer-events-none"
                  buttonClassName="absolute top-3 right-3 pointer-events-auto"
                  panelClassName="absolute left-full ml-2 top-3 z-30 w-60 rounded-2xl p-2 pointer-events-auto"
                  member={m}
                  onChangeRole={() => requestChangeRole(m)}
                  onToggleStatus={() => requestToggleStatus(m)}
                  onRemove={() => requestRemove(m)}
                />
              )}

              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full p-[3px] transition-transform hover:scale-105"
                  style={{
                    background:
                      m.status === "inactif"
                        ? "var(--border-subtle)"
                        : isOwnerMember(m)
                          ? "linear-gradient(145deg, #056cf2, #0a2a6b)"
                          : accentOf(m),
                    boxShadow: m.status === "actif" ? `0 8px 20px -8px ${hexToRgba(accentOf(m), 0.45)}` : "none",
                  }}
                  onClick={m.avatar ? () => setViewerMail(m.email) : undefined}
                  title={m.avatar ? "Voir la photo de profil" : undefined}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: "var(--card-bg)" }}
                  >
                    {m.avatar ? (
                      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${m.avatar})` }} />
                    ) : (
                      <UserRound
                        className="w-9 h-9"
                        style={{ color: m.status === "inactif" ? "var(--text-muted)" : accentOf(m) }}
                      />
                    )}
                  </div>
                </div>
                {isOwnerMember(m) && (
                  <span
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: OWNER_COLOR, boxShadow: "0 4px 10px -3px rgba(0,0,0,0.35)", border: "2px solid var(--card-bg)" }}
                  >
                    <Crown size={11} className="text-white" />
                  </span>
                )}
                {m.status === "actif" && !isOwnerMember(m) && (
                  <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                      style={{ background: "var(--color-success)" }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3.5 w-3.5"
                      style={{ background: "var(--color-success)", border: "2px solid var(--card-bg)" }}
                    />
                  </span>
                )}
              </div>

              <div className="text-center">
                <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {m.firstName} {m.lastName}
                </div>
                <div className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Mail size={11} /> {m.email}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {isOwnerMember(m) ? (
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
                ) : (
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
                )}
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={
                    m.status === "inactif"
                      ? { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }
                      : { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
                  }
                >
                  <CheckCircle2 size={11} />
                  {m.status === "inactif" ? "Inactif" : "Actif"}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                >
                  <ClipboardList size={11} /> {m.taskCount} tâche{m.taskCount > 1 ? "s" : ""}
                </span>
              </div>
              {m.status === "inactif" && (
                <div
                  className="w-full mt-1 text-center text-[10px] font-semibold px-2 py-1 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-error)" }}
                >
                  Aucune tâche possible
                </div>
              )}
              <div className="w-full mt-2 pt-3 text-center" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                  Membre depuis le {m.joinedAt}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
  <div className="space-y-3">
    {people.map((m) => (
      <motion.div
        key={m.email}
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
                boxShadow: m.status === "actif" ? `0 6px 14px -6px ${hexToRgba(accentOf(m), 0.4)}` : "none",
              }}
              onClick={m.avatar ? () => setViewerMail(m.email) : undefined}
              title={m.avatar ? "Voir la photo de profil" : undefined}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "var(--card-bg)" }}
              >
                {m.avatar ? (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${m.avatar})` }} />
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
              {m.firstName} {m.lastName}
            </div>
            <div className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Mail size={10} /> {m.email}
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
            style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <ClipboardList size={11} /> {m.taskCount} tâche{m.taskCount > 1 ? "s" : ""}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full"
            style={
              m.status === "inactif"
                ? { background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }
                : { background: "rgba(16,185,129,0.12)", color: "var(--color-success)" }
            }
          >
            <CheckCircle2 size={11} />
            {m.status === "inactif" ? "Inactif" : "Actif"}
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
)}

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
        const fullName = `${member.firstName} ${member.lastName}`.trim() || member.email;

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
          const isDeactivate = member.status === "actif";
          return (
            <ConfirmActionModal
              icon={<Ban size={20} />}
              tone={isDeactivate ? "danger" : "success"}
              title={isDeactivate ? "Désactiver ce compte" : "Réactiver ce compte"}
              description={
                <>
                  Confirmer la {isDeactivate ? "désactivation" : "réactivation"} du compte de{" "}
                  <strong>{fullName}</strong> ?
                  {isDeactivate && " Ce membre ne pourra plus recevoir de nouvelles tâches."}
                </>
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

      <AvatarViewer
        open={!!viewerMember}
        src={viewerMember?.avatar}
        onClose={() => setViewerMail(null)}
      />

      <InviteConfirmModal
        email={confirmEmail}
        agencyName={agency?.name ?? "cette agence"}
        onConfirm={confirmSendInvitation}
        onCancel={cancelSendInvitation}
      />
    </motion.div>
  );
}