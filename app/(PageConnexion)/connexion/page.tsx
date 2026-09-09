"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AuthCard from "../components/AuthCard";
import Image from "next/image";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#EC4899";
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
    // TODO backend : appeler POST /api/login quand on branchera l'API
    console.log("Connexion tentée:", { email, password });
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Visuel gauche (image) */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:block lg:w-[60%] relative overflow-hidden min-h-screen"
      >
        <Image
          src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop"
          alt="Gestion de tâches"
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
              backgroundImage: "linear-gradient(135deg, #F97316, #EC4899, #8B5CF6)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Organisez. Collaborez. Réalisez.
          </h2>
          <p className="text-white/80">
            Gérez vos projets et vos tâches en équipe, simplement et efficacement.
          </p>
        </div>
      </motion.div>

      {/* Formulaire droite */}
      <div className="w-full lg:w-[40%] min-h-screen flex items-center justify-center px-4 lg:px-8">
        <AuthCard>
          <div className="flex flex-col items-center">
            {/* Logo */}
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
              Connexion
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="text-sm mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              Connectez-vous à votre espace
            </motion.p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
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

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            >
              <input
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex justify-end"
            >
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm transition-colors hover:text-pink-500"
                style={{ color: "var(--text-secondary)" }}
              >
                Mot de passe oublié ?
              </Link>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all focus:outline-none"
              style={{
                background: "var(--gradient-button)",
                backgroundSize: "200% 200%",
                boxShadow: "0 10px 30px -10px rgba(236,72,153,0.6)",
                animation: "gradient-shift 3s ease infinite",
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="text-sm text-center pt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-semibold"
                style={{
                  backgroundImage: "linear-gradient(135deg, #F97316, #EC4899)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                S'inscrire
              </Link>
            </motion.p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}