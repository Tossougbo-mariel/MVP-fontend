"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  LogOut,
  Pencil,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
} from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();

  // Données utilisateur (factice — viendra du backend)
  const [firstName, setFirstName] = useState("Jean");
  const [lastName, setLastName] = useState("Dupont");
  const [email, setEmail] = useState("jean.dupont@email.com");
  const [role] = useState("Administrateur");
  const [tasksAssigned] = useState(14);
  const [tasksDone] = useState(9);
  const [tasksLate] = useState(2);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    // TODO backend : appeler POST /api/logout
    localStorage.removeItem("token");
    sessionStorage.clear();
    router.push("/connexion");
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4"
      style={{ background: "var(--bg-obsidian)" }}
    >
      <div className="w-full max-w-3xl">
        <div className="relative rounded-3xl p-8 md:p-10"
          style={{
            background: "var(--card-bg)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm mb-4 flex items-center gap-2"
              style={{ color: "var(--color-success)" }}
            >
              <CheckCircle2 size={16} /> Profil mis à jour
            </motion.p>
          )}

          {/* En-tête profil */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "0 0 40px var(--glow-pink)",
                }}
              >
                <User className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold"
                style={{
                  backgroundImage: "var(--gradient-primary)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {firstName} {lastName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-center md:justify-start gap-2 mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <Briefcase size={14} />
                <span className="rounded-full px-3 py-0.5 text-xs"
                  style={{
                    background: "var(--gradient-button)",
                    boxShadow: "0 0 15px var(--glow-pink)",
                  }}
                >
                  {role}
                </span>
              </motion.p>
            </div>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#F87171",
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </motion.button>
          </div>

          {/* Informations personnelles */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Informations personnelles
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
                  style={{
                    background: "var(--gradient-button)",
                    boxShadow: "0 5px 15px -5px rgba(236,72,153,0.5)",
                  }}
                >
                  <Pencil size={14} />
                  Modifier
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wide mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  disabled={!editing}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none disabled:opacity-70"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  disabled={!editing}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none disabled:opacity-70"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
                  <input
                    type="email"
                    value={email}
                    disabled={!editing}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none disabled:opacity-70"
                    style={{
                      background: "var(--input-bg)",
                      border: "1px solid var(--input-border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>

            {editing && (
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full md:w-auto px-6 py-2.5 rounded-xl font-medium text-white"
                style={{
                  background: "var(--gradient-button)",
                  backgroundSize: "200% 200%",
                  animation: "gradient-shift 3s ease infinite",
                  boxShadow: "0 10px 30px -10px rgba(236,72,153,0.6)",
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Save size={16} />
                  Enregistrer
                </span>
              </motion.button>
            )}
          </motion.div>

          {/* Statistiques */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4"
          >
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{tasksAssigned}</div>
              <div className="flex items-center justify-center gap-1 text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                <Briefcase size={12} /> Assignées
              </div>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>{tasksDone}</div>
              <div className="flex items-center justify-center gap-1 text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 size={12} /> Terminées
              </div>
            </div>
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="text-2xl font-bold" style={{ color: "var(--color-error)" }}>{tasksLate}</div>
              <div className="flex items-center justify-center gap-1 text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                <AlertTriangle size={12} /> En retard
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}