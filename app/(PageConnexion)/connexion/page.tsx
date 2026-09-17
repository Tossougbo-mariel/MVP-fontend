"use client";

import { useAuthStore } from "@/app/store/authStore";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useMotionValue, useSpring, type Variants } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft, Sparkles, Mail, Lock, Eye, EyeOff, CheckCircle2, Rocket, Users,
} from "lucide-react";
import AuthCard from "../components/AuthCard";
import MagneticButton from "../components/MagneticButton";


export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionContent />
    </Suspense>
  );
}

function ConnexionContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitation") ?? "";

  // --- Tilt 3D de la carte (rotation douce, type "spring") ---
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 22 });

  const handleTilt = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 10);
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
  };
  const resetTilt = () => { rotateX.set(0); rotateY.set(0); };

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

  const login = useAuthStore((s) => s.login);
  
  // ✅ CORRIGÉ : Login asynchrone branché sur l'API backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(invitationId ? `/accepter-invitation?id=${invitationId}` : "/mes-agences");
  };

  // --- Entrée en cascade : chaque enfant apparaît l'un après l'autre ---
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  };
  const item: Variants = {
    hidden: { y: 26, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* ====== VISUEL GAUCHE : image + aurores + cartes flottantes ====== */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="hidden lg:block lg:w-[58%] relative overflow-hidden min-h-screen"
      >
        {/* Aurores lumineuses qui respirent */}
        <div
          className="absolute -top-20 -left-20 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(5,108,242,0.45), transparent 60%)",
            animation: "aurora-breathe 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(156,199,255,0.35), transparent 60%)",
            animation: "aurora-breathe 11s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(88,155,255,0.4), transparent 60%)",
            animation: "aurora-breathe 8s ease-in-out infinite",
          }}
        />

        {/* Image fixe */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop"
            alt="Gestion de tâches"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(5,5,10,0.95) 0%, rgba(5,5,10,0.25) 50%, rgba(5,5,10,0.1) 100%)",
          }}
        />

        {/* Contenu du panneau */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="text-gradient text-4xl font-black mb-3 leading-tight"
          >
            Organisez. Collaborez.
            <br />
            {"Réalisez l'extraordinaire."}
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
            className="text-white/80 mb-8 max-w-md"
          >
            Gérez vos projets et vos tâches en équipe, simplement et efficacement.
          </motion.p>

          {/* Cartes flottantes */}
          <div className="flex gap-4">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--color-success)" }} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>98%</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>tâches à temps</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <Rocket className="w-6 h-6" style={{ color: "#056cf2" }} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Livraisons</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>en avance</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <Users className="w-6 h-6" style={{ color: "#9dc7ff" }} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Équipes</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>synchronisées</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ====== DROITE : formulaire avec carte 3D ====== */}
      <div className="w-full lg:w-[42%] min-h-screen flex items-center justify-center px-4 lg:px-8 relative">
        <Link
          href="/accueil"
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
        {/* Halo derrière la carte */}
        <div
          className="absolute w-[340px] h-[340px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, var(--glow-pink), transparent 60%)",
            animation: "glow-pulse 6s ease-in-out infinite",
          }}
        />

        <div style={{ perspective: 1200 }} className="w-full max-w-md">
          <motion.div
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          >
            <AuthCard>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
              >
                {/* Logo */}
                <motion.div variants={item} className="flex flex-col items-center mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{
                      background: "var(--gradient-primary)",
                      boxShadow: "0 0 35px var(--glow-pink)",
                    }}
                  >
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <h1
                      className="text-3xl font-black mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Connexion
                    </h1>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Ravi de vous revoir ! Entrez dans votre espace.
                    </p>
                  </div>
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div variants={item}>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <input
                        type="email"
                        placeholder="Adresse e-mail"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl pl-12 pr-4 py-3.5 transition-all focus:outline-none"
                        style={inputStyle}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={item}>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
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
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}
                        aria-label="Afficher ou masquer le mot de passe"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div variants={item} className="flex justify-end">
                    <Link
                      href="/mot-de-passe-oublie"
                      className="text-sm transition-colors hover:text-blue-500"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Mot de passe oublié ?
                    </Link>
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
                      {loading ? "Connexion..." : "Se connecter"}
                    </MagneticButton>
                  </motion.div>

                  <motion.p
                    variants={item}
                    className="text-sm text-center pt-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Pas encore de compte ?{" "}
                    <Link
                      href="/inscription"
                      className="font-semibold"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #0c79f2, #056cf2)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {"S'inscrire"}
                    </Link>
                  </motion.p>
                </form>
              </motion.div>
            </AuthCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
