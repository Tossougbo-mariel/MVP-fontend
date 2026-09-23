"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthCard from "../components/AuthCard";
import api, { getApiErrorMessage } from "@/lib/api";

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ color: "var(--text-secondary)" }}
        >
          Chargement...
        </div>
      }
    >
      <ReinitialiserMotDePasseForm />
    </Suspense>
  );
}

function ReinitialiserMotDePasseForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--blue)";
    e.currentTarget.style.boxShadow = "0 0 20px var(--glow-pink)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--input-border)";
    e.currentTarget.style.boxShadow = "none";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien de réinitialisation invalide ou manquant.");
      return;
    }
    if (!email) {
      setError("L'e-mail manque dans ce lien : redemandez votre lien de réinitialisation.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    // ✅ Branché : POST /api/password/reset avec token + email
    try {
      await api.post("/password/reset", {
        token,
        email,
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
    <div className="flex flex-col lg:flex-row items-stretch max-w-full w-full min-h-screen">
      {/* Visuel gauche */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:block lg:w-[60%] relative overflow-hidden min-h-screen"
      >
        <Image
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop"
          alt="Sécurité"
          fill
          style={{ objectFit: "cover" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(5,5,10,0.95) 0%, rgba(5,5,10,0.2) 50%, rgba(5,5,10,0.1) 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--blue-accent), var(--blue), var(--blue-mid))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Définissez un nouveau mot de passe
          </h2>
          <p className="text-white/80">
            Choisissez un mot de passe sécurisé pour protéger votre compte.
          </p>
        </div>
      </motion.div>

      {/* Formulaire droite */}
      <div className="lg:w-[40%] lg:min-h-screen flex items-center justify-center lg:pr-8 w-full px-4">
        <AuthCard>
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2 mb-2"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 30px var(--glow-pink)",
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-3xl font-bold text-center mb-1"
              style={{
                backgroundImage: "var(--gradient-primary)",
                backgroundSize: "200% 200%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                animation: "gradient-shift 4s ease infinite",
              }}
            >
              Nouveau mot de passe
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-sm text-center mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {success
                ? "Votre mot de passe a été modifié avec succès."
                : "Saisissez votre nouveau mot de passe ci-dessous"}
            </motion.p>
          </div>

          {success ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <CheckCircle2 className="w-16 h-16" style={{ color: "var(--color-success)" }} />
              <Link
                href="/connexion"
                className="w-full py-3 rounded-xl font-semibold text-white text-center transition-all focus:outline-none"
                style={{
                  background: "var(--gradient-button)",
                  backgroundSize: "200% 200%",
                  boxShadow: "0 10px 30px -10px rgba(var(--blue-rgb),0.55)",
                  animation: "gradient-shift 3s ease infinite",
                }}
              >
                Se connecter
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-sm"
                  style={{ color: "var(--color-error)", animation: "shake 0.4s" }}
                >
                  {error}
                </motion.p>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-12 transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-blue-500"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="relative"
              >
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-12 transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-blue-500"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all focus:outline-none"
                style={{
                  background: "var(--gradient-button)",
                  backgroundSize: "200% 200%",
                  boxShadow: "0 10px 30px -10px rgba(var(--blue-rgb),0.55)",
                  animation: "gradient-shift 3s ease infinite",
                }}
              >
                {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="text-center"
              >
                <Link
                  href="/connexion"
                  className="text-sm transition-colors hover:text-blue-500"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Retour à la connexion
                </Link>
              </motion.div>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}