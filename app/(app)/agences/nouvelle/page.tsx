"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Building2, ArrowLeft, Plus } from "lucide-react";
import { useAppData } from "@/lib/appData";
import { createAgency, getApiErrorMessage } from "@/lib/services";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const inputStyle = {
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--text-primary)",
};

export default function NouvelleAgencePage() {
  const router = useRouter();
  const { reload } = useAppData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom de l'agence est obligatoire.");
      return;
    }

    setLoading(true);
    try {
      const agency = await createAgency({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      await reload();
      router.push(`/agences/${agency.id}/dashboard`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-xl mx-auto space-y-6">
      <motion.div variants={item}>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 text-sm mb-4 transition-all hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à mes agences
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 4px 12px -4px rgba(37,99,235,0.35)" }}
          >
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              Créer une agence
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Créez votre espace de travail pour gérer projets, tâches et équipe.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-sm" style={{ color: "var(--color-error)", animation: "shake 0.4s" }}>
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              {"Nom de l'agence *"}
            </label>
            <input
              type="text"
              placeholder="Ex : MVP Studio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Description (optionnel)
            </label>
            <textarea
              placeholder="Décrivez l'activité de votre agence..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white focus:outline-none transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: "var(--gradient-button)",
              boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)",
            }}
          >
            {loading ? (
              "Création en cours..."
            ) : (
              <>
                <Plus className="w-5 h-5" />
                {"Créer l'agence"}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}