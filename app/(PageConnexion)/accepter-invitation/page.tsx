"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  UserPlus, Check, X, ArrowRight, Mail,
} from "lucide-react";
import AuthCard from "../components/AuthCard";
import { useAuthStore } from "@/app/store/authStore";
import { acceptInvitation, fetchInvitationPreview, getApiErrorMessage } from "@/lib/services";
import type { InvitationPreview } from "@/lib/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(() => !!token);
  const [pageError, setPageError] = useState<string | null>(
    token ? null : "Lien invalide : aucun code d'invitation fourni.",
  );
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!token) return;
    void fetchInvitationPreview(token)
      .then((p) => {
        if (alive) {
          setPreview(p);
          setPageError(null);
        }
      })
      .catch((err) => {
        if (alive) setPageError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const emailMismatch =
    !!user && !!preview && user.email.toLowerCase() !== preview.email.toLowerCase();

  const handleAccept = async () => {
    if (!user) return;
    setProcessing(true);
    setError(null);
    try {
      await acceptInvitation(token);
      setAccepted(true);
      setTimeout(() => router.push("/mes-agences"), 1400);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProcessing(false);
    }
  };

  if (pageError) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto py-8"
      >
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
                Invitation introuvable ou expirée
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                {pageError} Cette invitation a peut-être expiré, été annulée, ou le lien est incomplet.
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
      </motion.div>
    );
  }

  if (accepted) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto py-8"
      >
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
                Invitation acceptée !
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Votre adhésion est confirmée. Redirection vers Mes agences...
              </p>
            </div>
          </AuthCard>
        </motion.div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md mx-auto py-8"
      >
        <motion.div variants={item}>
          <AuthCard padding="p-6">
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Mail className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Vérification de l&apos;invitation...
              </p>
            </div>
          </AuthCard>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-md mx-auto py-8"
    >
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
              Invitation à rejoindre une agence
            </h1>
            {preview && (
              <p className="mt-2 text-sm flex items-center justify-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <Mail size={12} /> {preview.email}
              </p>
            )}
          </div>

          {preview && (
            <motion.div variants={item} className="mb-5">
              <div
                className="rounded-2xl px-5 py-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>
                  Vous êtes invité·e à rejoindre
                </div>
                <div className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {preview.agency.name}
                </div>
                <div className="text-sm font-semibold mt-2" style={{ color: "var(--text-secondary)" }}>
                  Rôle : {preview.role === "admin" ? "Admin" : "Membre"}
                </div>
              </div>
            </motion.div>
          )}

          {!user ? (
            <motion.div variants={item} className="space-y-3">
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Pour rejoindre l&apos;agence, créez votre compte ou connectez-vous — la confirmation se fera
                automatiquement ensuite.
              </div>
              <Link
                href={`/inscription?invitation=${token}`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "var(--gradient-button)", boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)" }}
              >
                Créer mon compte <ArrowRight size={16} />
              </Link>
              <Link
                href={`/connexion?invitation=${token}`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                J&apos;ai déjà un compte · Me connecter
              </Link>
            </motion.div>
          ) : emailMismatch ? (
            <motion.div variants={item} className="space-y-3">
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-error)" }}
              >
                Cette invitation est liée à l&apos;e-mail <b>{preview?.email}</b>, alors que vous êtes connecté·e en tant
                que <b>{user.email}</b>. Déconnectez-vous puis connectez-vous avec le bon compte pour l&apos;accepter.
              </div>
              <Link
                href={`/connexion?invitation=${token}`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Changer de compte <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
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
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Connecté en tant que {user.firstName} {user.lastName} ({user.email})
              </p>
            </motion.div>
          )}
        </AuthCard>
      </motion.div>
    </motion.div>
  );
}