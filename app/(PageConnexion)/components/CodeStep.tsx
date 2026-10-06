"use client";

// ============================================================
// Saisie d'un code à 6 chiffres envoyé par email.
//
// Le même composant sert à la connexion sans mot de passe et à la double
// authentification : seule la fonction de validation change.
// ============================================================
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import MagneticButton from "./MagneticButton";

export type CodeStepResult = { ok: boolean; error: string | null };

type CodeStepProps = {
  title: string;
  subtitle: string;
  /** Renvoie `error` non nul en cas d'échec (code faux, expiré, trop de tentatives). */
  onSubmit: (code: string) => Promise<CodeStepResult>;
  /** Renvoyer un nouveau code. Absent si le renvoi n'est pas proposé. */
  onResend?: () => Promise<CodeStepResult>;
  onBack?: () => void;
  backLabel?: string;
  /** Le compte est-il connu ? Change le libellé du renvoi. */
  resendLabel?: string;
};

export default function CodeStep({
  title,
  subtitle,
  onSubmit,
  onResend,
  onBack,
  backLabel = "Retour",
  resendLabel = "Renvoyer le code",
}: CodeStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setError(null);
    setNotice(null);
    setLoading(true);

    const result = await onSubmit(code);
    if (!result.ok) setError(result.error);

    setLoading(false);
  };

  const handleResend = async () => {
    if (!onResend) return;

    setError(null);
    setNotice(null);
    setResending(true);

    const result = await onResend();
    if (result.ok) setNotice("Un nouveau code vient d'être envoyé.");
    else setError(result.error);

    setResending(false);
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 0 35px var(--glow-pink)",
          }}
        >
          <MailCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
      </motion.div>

      {error && (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm text-center"
          style={{ color: "var(--color-error)", animation: "shake 0.4s" }}
        >
          {error}
        </motion.p>
      )}

      {notice && (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-sm text-center"
          style={{ color: "var(--color-success)" }}
        >
          {notice}
        </motion.p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <KeyRound
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            inputMode="numeric"
            // Permet aux gestionnaires d'e-mail de proposer le code sans le
            // recopier, et le rend lisible par les lecteurs d'écran.
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl pl-12 pr-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] transition-all focus:outline-none"
            style={inputStyle}
          />
        </div>

        <MagneticButton
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            background: "var(--gradient-button)",
            backgroundSize: "200% 200%",
            boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)",
            animation: "gradient-shift 3s ease infinite",
            color: "#fff",
            width: "100%",
            opacity: code.length === 6 ? 1 : 0.6,
          }}
          className="w-full py-3.5 rounded-xl font-semibold focus:outline-none"
        >
          {loading ? "Vérification..." : "Valider le code"}
        </MagneticButton>
      </form>

      <div className="flex items-center justify-between text-sm">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        ) : (
          <span />
        )}

        {onResend && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: "#056cf2" }}
          >
            {resending ? "Envoi..." : resendLabel}
          </button>
        )}
      </div>
    </div>
  );
}
