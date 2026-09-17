"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  UserPlus, Building2, Check, X, ArrowRight, ShieldCheck, Mail,
} from "lucide-react";
import AuthCard from "../components/AuthCard";
import { useAuthStore } from "@/app/store/authStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";
import { acceptInvitationForUser } from "@/app/lib/invitations";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const invitations = useNotificationsStore((s) => s.invitations);
  const declineInvitation = useNotificationsStore((s) => s.declineInvitation);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  const invitation = invitations.find((i) => i.id === id);
  const agencyName = invitation?.agencyName ?? "cette agence";

  const handleAccept = () => {
    if (!user || !invitation) return;
    setProcessing(true);
    setError(null);
    const res = acceptInvitationForUser(id, user);
    setProcessing(false);
    if (res.ok) {
      setAccepted(true);
      setTimeout(() => router.push(`/agences/${res.agencyId}/dashboard`), 1400);
    } else {
      setError(res.message);
    }
  };

  const handleDecline = () => {
    if (!invitation) return;
    declineInvitation(id);
    setDeclined(true);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-md mx-auto py-8"
    >
      {/* ====== Invitation introuvable ====== */}
      {!invitation ? (
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(239,68,68,0.12)", color: "var(--color-error)" }}
              >
                <X className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Lien invalide ou invitation introuvable
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Cette invitation a peut-être expiré ou été annulée, ou n&apos;est pas accessible depuis cet appareil.
                Contactez le propriétaire de l&apos;agence pour obtenir un nouveau lien.
              </p>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <ArrowRight size={16} /> Aller à la connexion
              </Link>
            </div>
          </AuthCard>
        </motion.div>
      ) : invitation.status !== "pending" ? (
        /* ====== Invitation déjà traitée ====== */
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(245,158,11,0.14)", color: "#d97706" }}
              >
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Cette invitation a déjà été traitée
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                L&apos;invitation à rejoindre {agencyName} est maintenant {invitation.status === "accepted" ? "acceptée" : "refusée"}.
              </p>
              <Link
                href="/mes-agences"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <Building2 size={16} /> Mes agences
              </Link>
            </div>
          </AuthCard>
        </motion.div>
      ) : accepted ? (
        /* ====== Acceptée avec succès ====== */
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}
              >
                <Check className="w-8 h-8" />
              </motion.div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Bienvenue dans {agencyName} !
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Votre adhésion est confirmée. Redirection vers l&apos;agence...
              </p>
            </div>
          </AuthCard>
        </motion.div>
      ) : declined ? (
        /* ====== Refusée ====== */
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "rgba(245,158,11,0.14)", color: "#d97706" }}
              >
                <X className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Invitation refusée
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Vous avez refusé l&apos;invitation à rejoindre {agencyName}.
              </p>
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <ArrowRight size={16} /> Retour à la connexion
              </Link>
            </div>
          </AuthCard>
        </motion.div>
      ) : (
        /* ====== Invitation active ====== */
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 15 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 30px var(--glow-pink)",
                }}
              >
                <UserPlus className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Invitation à rejoindre {agencyName}
              </h1>
              <div className="mt-2 text-sm space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                <p>Envoyée par <span className="font-medium" style={{ color: "var(--text-primary)" }}>{invitation.fromEmail}</span></p>
                <p className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Mail size={12} /> {invitation.toEmail} · le {invitation.createdAt}
                </p>
              </div>
            </div>

            {!user ? (
              /* ====== Pas connecté : créer un compte ou se connecter ====== */
              <motion.div variants={item} className="space-y-3">
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  Pour rejoindre <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{agencyName}</span>,
                  créez votre compte — la confirmation se fera automatiquement.
                </div>
                <Link
                  href={`/inscription?invitation=${id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)" }}
                >
                  Créer mon compte <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/connexion?invitation=${id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  J&apos;ai déjà un compte · Me connecter
                </Link>
              </motion.div>
            ) : (
              /* ====== Connecté : accepter / refuser ====== */
              <motion.div variants={item} className="space-y-3">
                {error && (
                  <p
                    className="text-sm px-4 py-3 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-error)" }}
                  >
                    {error}
                  </p>
                )}
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)" }}
                >
                  {processing ? "Traitement..." : (
                    <>
                      <Check size={16} /> Accepter l&apos;invitation
                    </>
                  )}
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--color-error)" }}
                >
                  <X size={15} /> Refuser
                </button>
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Connecté en tant que {user.firstName} {user.lastName} ({user.email})
                </p>
              </motion.div>
            )}
          </AuthCard>
        </motion.div>
      )}
    </motion.div>
  );
}