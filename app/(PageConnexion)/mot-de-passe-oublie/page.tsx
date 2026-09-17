"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft } from "lucide-react";
import AuthCard from "../components/AuthCard";
import api, { getApiErrorMessage } from "@/lib/api";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    // ✅ Branché : POST /api/password/forgot
    try {
      await api.post("/password/forgot", { email });
      setLoading(false);
      setSent(true);
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
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop"
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
              backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2, #589bff)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Récupérez votre accès
          </h2>
          <p className="text-white/80">
            Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
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
              Mot de passe oublié
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-sm text-center mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {sent
                ? "Un lien de réinitialisation a été envoyé à votre adresse."
                : "Entrez votre e-mail pour recevoir un lien de réinitialisation"}
            </motion.p>
          </div>

          {!sent && (
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
              >
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 transition-all focus:outline-none"
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all focus:outline-none"
                style={{
                  background: "var(--gradient-button)",
                  backgroundSize: "200% 200%",
                  boxShadow: "0 10px 30px -10px rgba(5,108,242,0.55)",
                  animation: "gradient-shift 3s ease infinite",
                }}
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </motion.button>
            </form>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-center mt-6"
          >
            <Link
              href="/connexion"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-blue-500"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </motion.div>
        </AuthCard>
      </div>
    </div>
  );
}