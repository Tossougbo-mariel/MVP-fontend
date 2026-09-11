"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Bell, UserPlus, Check, X } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAgencyStore } from "@/app/store/agencyStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const invitations = useNotificationsStore((s) => s.invitations);
  const pending = useMemo(
    () =>
      invitations.filter(
        (i) =>
          i.toEmail.toLowerCase() === (user?.email ?? "").toLowerCase() &&
          i.status === "pending",
      ),
    [invitations, user?.email],
  );
  const acceptInvitation = useNotificationsStore((s) => s.acceptInvitation);
  const declineInvitation = useNotificationsStore((s) => s.declineInvitation);
  const addMember = useAgencyStore((s) => s.addMember);

  const handleAccept = (id: string, agencyId: string, agencyName: string) => {
    if (!user) return;
    const ok = addMember(agencyId, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar ?? null,
      role: "membre",
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    if (ok) {
      acceptInvitation(id);
    } else {
      alert("Vous êtes déjà membre de cette agence.");
      declineInvitation(id);
    }
  };

  const handleDecline = (id: string) => declineInvitation(id);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Bell className="w-6 h-6" style={{ color: "#056cf2" }} /> Notifications
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {pending.length > 0
            ? `${pending.length} invitation(s) en attente`
            : "Vous êtes à jour : aucune notification."}
        </p>
      </motion.div>

      {pending.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[40vh] text-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Bell className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            Aucune invitation pour le moment, {user?.firstName ?? ""}.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {pending.map((inv) => (
            <motion.div
              key={inv.id}
              variants={item}
              className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <UserPlus className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Invitation à rejoindre {inv.agencyName}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Envoyée par {inv.fromEmail || "un administrateur"} le {inv.createdAt}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(inv.id, inv.agencyId, inv.agencyName)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-transform hover:scale-105"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
                >
                  <Check size={14} /> Accepter
                </button>
                <button
                  onClick={() => handleDecline(inv.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--color-error)" }}
                >
                  <X size={14} /> Refuser
                </button>
              </div>
            </motion.div>
          ))}

          <motion.p variants={item} className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
            En acceptant, vous apparaîtrez automatiquement dans l&apos;équipe de cette agence.
          </motion.p>
        </div>
      )}
    </motion.div>
  );
}