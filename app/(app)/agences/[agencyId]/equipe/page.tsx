"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { Users, Mail, ShieldCheck, UserRound, UserPlus, Plus } from "lucide-react";
import { useAgencyStore } from "@/app/store/agencyStore";
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

export default function EquipePage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));
  const user = useAuthStore((s) => s.user);
  const sendInvitation = useNotificationsStore((s) => s.sendInvitation);
  const userExists = useRegisteredUsersStore((s) => s.userExists);

  const members = agency?.members ?? [];
  const isAdmin = agency?.role === "admin";

  // ====== Visionneuse de photo ======
  const [viewerMail, setViewerMail] = useState<string | null>(null);
  const viewerMember = members.find((m) => m.email === viewerMail);

  // ====== Formulaire d'invitation ======
  const [email, setEmail] = useState("");

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

    const ok = sendInvitation({
      agencyId,
      agencyName: agency?.name ?? "Agence",
      toEmail: trimmed,
      fromEmail: user?.email ?? "",
    });

    if (ok) {
      setEmail("");
    } else {
      alert("Une invitation active existe déjà pour cet email.");
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Users className="w-6 h-6" style={{ color: "#056cf2" }} /> Équipe
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {members.length} agent{members.length > 1 ? "s" : ""} dans {agency?.name ?? "cette agence"}
        </p>
      </motion.div>

      {members.length === 0 && (
        <motion.div variants={item} className="glass rounded-2xl p-8 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            Aucun agent pour le moment. Invitez le premier membre de l&apos;équipe.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((m) => (
          <motion.div
            key={m.email}
            variants={item}
            className="glass rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: "var(--gradient-primary)",
                cursor: m.avatar ? "pointer" : "default",
              }}
              onClick={m.avatar ? () => setViewerMail(m.email) : undefined}
              title={m.avatar ? "Voir la photo de profil" : undefined}
            >
              {m.avatar ? (
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${m.avatar})` }} />
              ) : (
                <UserRound className="w-9 h-9 text-white/80" />
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

            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={
                m.role === "admin"
                  ? { background: "var(--gradient-button)", color: "#fff" }
                  : { background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }
              }
            >
              <ShieldCheck size={11} className="inline mr-1" />
              {m.role === "admin" ? "Admin" : "Membre"}
            </span>
          </motion.div>
        ))}
      </div>

      {isAdmin && (
        <motion.form
          variants={item}
          onSubmit={handleInvite}
          className="glass rounded-2xl p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="font-bold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
            <UserPlus size={18} /> Inviter un agent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email de l'agent à inviter"
              type="email"
              required
              className="rounded-xl px-4 py-2.5 text-sm focus:outline-none sm:col-span-3"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            <Plus size={16} /> Inviter
          </button>
        </motion.form>
      )}

      <AvatarViewer
        open={!!viewerMember}
        src={viewerMember?.avatar}
        onClose={() => setViewerMail(null)}
      />
    </motion.div>
  );
}