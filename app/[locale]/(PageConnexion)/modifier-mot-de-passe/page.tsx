"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion, type Variants } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
import AuthCard from "../components/AuthCard";
import MagneticButton from "../components/MagneticButton";
import { useAuthStore } from "@/app/store/authStore";
import api, { getApiErrorMessage } from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ModifierMotDePassePage() {
  const t = useTranslations("Auth.changePassword");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
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

    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("errors.mismatch"));
      return;
    }
    if (currentPassword === password) {
      setError(t("errors.sameAsCurrent"));
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
                {t("title")}
              </h1>
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                {t("subtitle")}
              </p>
            </motion.div>

            {error && (
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-sm mb-4"
                style={{ color: "var(--color-error)", animation: "shake 0.4s" }}
              >
                {error === "Errors.generic" ? tErrors("generic") : error}
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
                  {t("success.title")}
                </p>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  {t("success.message")}
                </p>
                {t.rich("backToProfile", {
                  profile: (chunks) => (
                    <Link
                      href="/connexion"
                      onClick={(e) => {
                        e.preventDefault();
                        void (async () => {
                          await logout();
                          router.push("/connexion");
                        })();
                      }}
                      className="font-semibold"
                      style={{
                        backgroundImage: "linear-gradient(135deg, var(--blue-accent), var(--blue))",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {chunks}
                    </Link>
                  ),
                })}
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
                      placeholder={t("fields.current")}
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
                      aria-label={t("fields.toggleCurrent")}
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
                      placeholder={t("fields.new")}
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
                      aria-label={t("fields.toggleNew")}
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
                      placeholder={t("fields.confirm")}
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
                      aria-label={t("fields.toggleConfirm")}
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
                      boxShadow: "0 10px 30px -10px rgba(var(--blue-rgb),0.55)",
                      animation: "gradient-shift 3s ease infinite",
                      color: "#fff",
                      width: "100%",
                    }}
                    className="w-full py-3.5 rounded-xl font-semibold focus:outline-none"
                  >
                    {loading ? t("submitLoading") : t("submit")}
                  </MagneticButton>
                </motion.div>

                <motion.p
                  variants={item}
                  className="text-sm text-center pt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t.rich("backToProfile", {
                    profile: (chunks) => (
                      <Link
                        href="/connexion"
                        className="font-semibold"
                        style={{
                          backgroundImage: "linear-gradient(135deg, var(--blue-accent), var(--blue))",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </motion.p>
              </form>
            )}
          </motion.div>
        </AuthCard>
      </div>
    </div>
  );
}