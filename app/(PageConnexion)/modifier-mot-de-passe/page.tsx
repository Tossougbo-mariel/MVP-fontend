"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
import AuthCard from "../components/AuthCard";
import MagneticButton from "../components/MagneticButton";
import api, { getApiErrorMessage } from "@/lib/api";

export default function ModifierMotDePassePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const item: Variants = {
    hidden: { y: 24, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.55, ease: "easeOut" } },
  };

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#056cf2";
    e.currentTarget.style.boxShadow = "0 0 20px var(--glow-pink)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--input-border)";
    e.currentTarget.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (currentPassword === password) {
      setError("Le nouveau mot de passe doit être différent de l'actuel.");
      return;
    }

    setLoading(true);
    // ✅ Branché : POST /api/change-password
    try {
      await api.post("/change-password", {
        current_password: currentPassword,
        password,
        password_confirmation: password,
      });
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen items-center justify-center px-4 relative">
      {/* Halo derrière la carte */}
      <div
        className="absolute w-[340px] h-[340px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--glow-pink), transparent 60%)",
          animation: "glow-pulse 6s ease-in-out infinite",
        }}
      />

      <div style={{ perspective: 1200 }} className="w-full max-w-md">
        <AuthCard>
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="flex flex-col items-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 35px var(--glow-pink)",
                }}
              >
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1
                className="text-3xl font-black mb-1 text-center"
                style={{ color: "var(--text-primary)" }}
              >
                Modifier le mot de passe
              </h1>
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                Choisissez un nouveau mot de passe sécurisé.
              </p>
            </motion.div>

            {error && (
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-sm mb-4"
                style={{ color: "var(--color-error)", animation: "shake 0.4s" }}
              >
                {error}
              </motion.p>
            )}

            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="flex flex-col items-center py-6 text-center"
              >
                <CheckCircle2
                  className="w-16 h-16 mb-3"
                  style={{ color: "var(--color-success)" }}
                />
                <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  Mot de passe modifié !
                </p>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Votre mot de passe a été mis à jour avec succès.
                </p>
                <Link
                  href="/mon_profil"
                  className="font-semibold"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Retour à mon profil
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mot de passe actuel */}
                <motion.div variants={item}>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Mot de passe actuel"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl pl-12 pr-12 py-3.5 transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Afficher ou masquer le mot de passe actuel"
                    >
                      {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Nouveau mot de passe */}
                <motion.div variants={item}>
                  <div className="relative">
                    <ShieldCheck
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type={showNew ? "text" : "password"}
                      placeholder="Nouveau mot de passe"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl pl-12 pr-12 py-3.5 transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Afficher ou masquer le nouveau mot de passe"
                    >
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirmation */}
                <motion.div variants={item}>
                  <div className="relative">
                    <KeyRound
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirmer le nouveau mot de passe"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl pl-12 pr-12 py-3.5 transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}
                      aria-label="Afficher ou masquer la confirmation"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={item}>
                  <MagneticButton
                    type="submit"
                    disabled={loading}
                    style={{
                      background: "var(--gradient-button)",
                      backgroundSize: "200% 200%",
                      boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)",
                      animation: "gradient-shift 3s ease infinite",
                      color: "#fff",
                      width: "100%",
                    }}
                    className="w-full py-3.5 rounded-xl font-semibold focus:outline-none"
                  >
                    {loading ? "Enregistrement..." : "Mettre à jour"}
                  </MagneticButton>
                </motion.div>

                <motion.p
                  variants={item}
                  className="text-sm text-center pt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Retour à{" "}
                  <Link
                    href="/mon_profil"
                    className="font-semibold"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    mon profil
                  </Link>
                </motion.p>
              </form>
            )}
          </motion.div>
        </AuthCard>
      </div>
    </div>
  );
}